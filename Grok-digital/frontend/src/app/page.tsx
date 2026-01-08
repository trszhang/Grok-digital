"use client";
import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import { useMicVAD } from "@ricky0123/vad-react";
import { Avatar } from "@/components/canvas/Avatar";
import { audioSystem } from "@/lib/audio/AudioQueue";
import { useStore } from "@/store/useStore";

export default function Page() {
    const socket = useRef<WebSocket | null>(null);
    const [log, setLog] = useState<string[]>([]);
    const { isTalking } = useStore();

    // Voice Activity Detection
    const vad = useMicVAD({
        onSpeechEnd: (audio) => {
            // NOTE: 'audio' is Float32Array. 
            // In production, convert to WAV Blob before sending.
            // For this specific code path, we send a text trigger simulation 
            // assuming the backend also accepts text, or you implement STT (Whisper) client-side.
            console.log("Speech detected, sending trigger...");
            if(socket.current) socket.current.send("Hello, tell me a short fact about space.");
        }
    });

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8000/ws/chat");
        
        ws.onopen = () => console.log("Connected to Brain");
        
        ws.onmessage = async (e) => {
            const data = JSON.parse(e.data);
            if (data.type === "text") {
                setLog(prev => [...prev.slice(-4), "AI: " + data.content]);
            } else if (data.type === "audio") {
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
        <main className="h-screen w-full bg-slate-900 text-white relative">
            <Canvas camera={{ position: [0, 0, 1.5] }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 10, 5]} />
                <Environment preset="city" />
                <Avatar />
                <OrbitControls enableZoom={false} target={[0, 0, 0]} />
            </Canvas>

            <div className="absolute top-0 left-0 p-6 z-10 w-full flex justify-between">
                <div>
                    <h1 className="text-xl font-bold tracking-widest">DIGITAL HUMAN</h1>
                    <div className="flex items-center gap-2 text-xs mt-1 text-slate-400">
                        <div className={`w-2 h-2 rounded-full ${socket.current ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        STATUS: {socket.current ? "ONLINE" : "OFFLINE"}
                    </div>
                </div>
                
                <div className="w-96 text-right">
                    {log.map((line, i) => (
                        <div key={i} className="text-sm opacity-80 mb-1">{line}</div>
                    ))}
                </div>
            </div>

            <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
                {!vad.listening && (
                    <button 
                        onClick={startSession}
                        className="px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition"
                    >
                        INITIALIZE INTERFACE
                    </button>
                )}
                {vad.listening && (
                    <div className={`px-6 py-2 rounded-full text-xs font-mono border ${isTalking ? 'border-green-500 text-green-500' : 'border-slate-500 text-slate-500'}`}>
                        {isTalking ? "AI SPEAKING" : "LISTENING..."}
                    </div>
                )}
            </div>
        </main>
    );
}