import { create } from 'zustand';

interface AppState {
  isConnected: boolean;
  isTalking: boolean; // Is the AI talking?
  transcript: string[]; // Chat log
  setConnected: (status: boolean) => void;
  setTalking: (status: boolean) => void;
  addLog: (text: string) => void;
}

export const useStore = create<AppState>((set) => ({
  isConnected: false,
  isTalking: false,
  transcript: [],
  setConnected: (status) => set({ isConnected: status }),
  setTalking: (status) => set({ isTalking: status }),
  addLog: (text) => set((state) => ({ 
    transcript: [...state.transcript.slice(-5), text] // Keep last 6 lines
  })),
}));