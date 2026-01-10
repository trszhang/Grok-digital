import { useStore } from "@/store/useStore";

export class AudioQueue {
  private ctx: AudioContext | null = null;
  private nextTime = 0;
  // Queue to hold viseme events: { time: absoluteTime, value: char }
  public visemeEvents: any[] = []; 

  constructor() {
    if (typeof window !== "undefined") {
      const Audio = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new Audio();
    }
  }

  async initialize() {
    if (this.ctx?.state === "suspended") await this.ctx.resume();
  }

  async enqueue(base64Audio: string, alignmentData?: any) {
    if (!this.ctx) return;
    
    // Decode Audio
    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const buffer = await this.ctx.decodeAudioData(bytes.buffer);

    // Schedule Audio
    const now = this.ctx.currentTime;
    // Buffer safety: schedule 50ms ahead if queue is empty
    const startTime = Math.max(this.nextTime, now + 0.05);
    
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.ctx.destination);
    source.start(startTime);
    
    this.nextTime = startTime + buffer.duration;

    // Schedule Visemes
    if (alignmentData && alignmentData.characters) {
        const { characters, character_start_times_seconds } = alignmentData;
        characters.forEach((char: string, index: number) => {
            this.visemeEvents.push({
                time: startTime + character_start_times_seconds[index],
                char: char,
                duration: 0.1 // Default hold duration
            });
        });
    }

    useStore.getState().setTalking(true);
    
    // Cleanup callback
    source.onended = () => {
        if (this.ctx!.currentTime >= this.nextTime - 0.1) {
            useStore.getState().setTalking(false);
        }
    };
  }

  getCurrentTime() {
    return this.ctx?.currentTime || 0;
  }
}

export const audioSystem = new AudioQueue();