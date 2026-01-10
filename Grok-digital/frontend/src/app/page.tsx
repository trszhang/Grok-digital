"use client";
import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import { useMicVAD } from "@ricky0123/vad-react";
import { Avatar } from "@/components/canvas/Avatar";
import { audioSystem } from "@/lib/audio/AudioQueue";
import { useStore } from "@/store/useStore";
import { encodeWAV } from "@/lib/utils/wavEncoder"; // <--- Import encoder

export default function Page() {
    const socket = useRef<WebSocket | null>(null);
    const { isTalking, addLog, transcript, setConnected } = useStore();

    // VAD Hook
    const vad = useMicVAD({
        // When speech ends, convert to WAV and send via WebSocket
        onSpeechEnd: (audio) => {
            if (!socket.current || socket.current.readyState !== WebSocket.OPEN) return;
            
            console.log("Sending audio...");
            // Encode Float32Array to WAV Blob
            const wavBlob = encodeWAV(audio, 16000); 
            
            // Send binary directly
            socket.current.send(wavBlob);
        },
        workletURL: "/vad.worklet.bundle.min.js", // Default path for VAD worklet
    });

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8000/ws/chat");
        
        ws.onopen = () => setConnected(true);
        ws.onclose = () => setConnected(false);
        
        ws.onmessage = async (e) => {
            const data = JSON.parse(e.data);
            
            if (data.type === "transcription") {
                addLog("You: " + data.content);
            } 
            else if (data.type === "text") {
                // Streaming text (add to last line or new line logic)
                // For simplicity, we just log it
                // In production, update the UI "AI Bubble" in real-time
            } 
            else if (data.type === "audio") {
                await audioSystem.enqueue(data.payload, data.visemes);
            }
        };

        socket.current = ws;
        return () => ws.close();
    }, []);

    const startSession = async () => {
        await audioSystem.initialize();
        vad.start();
    };

    return (
        <main className="h-screen w-full bg-slate-950 text-white relative overflow-hidden">
            {/* 3D Scene */}
            <div className="absolute inset-0 z-0">
                <Canvas camera={{ position: [0, 0, 1.3], fov: 45 }}>
                    <ambientLight intensity={0.4} />
                    <spotLight position={[5, 10, 5]} intensity={1.5} penumbra={1} />
                    {/* Add a rim light for that "Digital" look */}
                    <spotLight position={[-5, 5, -5]} intensity={2} color="#00ffff" />
                    <Environment preset="city" />
                    <Avatar />
                    <OrbitControls enableZoom={false} enablePan={false} target={[0, 0.1, 0]} />
                </Canvas>
            </div>

            {/* UI Overlay */}
            <div className="absolute inset-0 z-10 pointer-events-none p-8 flex flex-col justify-between">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold tracking-[0.2em] font-mono">AURA<span className="text-cyan-500">.AI</span></h1>
                        <div className="flex items-center gap-2 mt-1">
                            <div className={`w-2 h-2 rounded-full ${useStore.getState().isConnected ? 'bg-cyan-500 shadow-[0_0_10px_#00ffff]' : 'bg-red-500'}`} />
                            <span className="text-[10px] font-mono opacity-60">SYSTEM READY</span>
                        </div>
                    </div>
                </div>

                {/* Captions / Transcript */}
                <div className="w-full max-w-2xl mx-auto text-center space-y-2 mb-20">
                    {transcript.map((line, i) => (
                        <div key={i} className="bg-black/40 backdrop-blur-sm px-4 py-2 rounded-lg inline-block mx-1">
                            <p className="text-sm font-medium font-sans opacity-90">{line}</p>
                        </div>
                    ))}
                    
                    {/* Visualizer / Status */}
                    <div className="h-8 flex items-center justify-center gap-1 mt-4">
                        {vad.listening && !isTalking && (
                            <span className="text-cyan-400 text-xs font-mono animate-pulse">LISTENING DETECTED</span>
                        )}
                        {isTalking && (
                            <div className="flex gap-1">
                                {[1,2,3,4,5].map(i => (
                                    <div key={i} className="w-1 bg-cyan-400 animate-bounce" style={{height: '10px', animationDelay: `${i*0.1}s`}}/>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
                {!vad.listening && (
                    <button 
                        onClick={startSession}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white px-10 py-3 rounded-full font-bold transition shadow-lg shadow-cyan-500/20"
                    >
                        INITIALIZE CONNECTION
                    </button>
                )}
            </div>
        </main>
    );
}