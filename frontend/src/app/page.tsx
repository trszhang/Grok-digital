"use client";
import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, Stars, Sparkles } from "@react-three/drei";
import { useMicVAD } from "@ricky0123/vad-react";
import { Avatar } from "@/components/canvas/Avatar";
import { audioSystem } from "@/lib/audio/AudioQueue";
import { useStore } from "@/store/useStore";
import { encodeWAV } from "@/lib/utils/wavEncoder";

export default function Page() {
    const socket = useRef<WebSocket | null>(null);
    const { isTalking, addLog, transcript, setConnected, isConnected } = useStore();
    const [sessionStarted, setSessionStarted] = useState(false);

    const vad = useMicVAD({
        startOnLoad: false,
        onSpeechEnd: (audio) => {
            if (!socket.current || socket.current.readyState !== WebSocket.OPEN) return;
            const wavBlob = encodeWAV(audio, 16000);
            socket.current.send(wavBlob);
        },
        workletURL: "/vad.worklet.bundle.min.js",
    });

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8000/ws/chat");
        ws.onopen = () => setConnected(true);
        ws.onclose = () => setConnected(false);
        ws.onmessage = async (e) => {
            const data = JSON.parse(e.data);
            if (data.type === "transcription") addLog("You: " + data.content);
            else if (data.type === "audio") await audioSystem.enqueue(data.payload, data.visemes);
        };
        socket.current = ws;
        return () => ws.close();
    }, [setConnected, addLog]);

    const startSession = async () => {
        setSessionStarted(true);
        await audioSystem.initialize();
        vad.start();
    };

    return (
        <main style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh', 
            backgroundColor: '#000000',
            overflow: 'hidden'
        }}>
            
            {/* LAYER 1: 3D CANVAS */}
            <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%', 
                zIndex: 1 
            }}>
                <Canvas camera={{ position: [0, 0, 1.4], fov: 45 }}>
                    <color attach="background" args={['#050505']} />
                    <Stars radius={300} depth={50} count={20000} factor={4} saturation={0} fade={false} speed={1} />
                    <Sparkles count={50} scale={5} size={4} speed={0.4} opacity={0.5} noise={0.2} color="#00ffff" />
                    <Environment preset="city" />
                    <ambientLight intensity={0.8} />
                    <spotLight position={[5, 10, 5]} intensity={2} penumbra={1} />
                    <spotLight position={[-5, 5, -5]} intensity={3} color="#00ffff" />
                    
                    {/* CHANGED: Moved Y from 0.1 to 0.4 to lift Avatar up */}
                    <group position={[0, 0.6, 0]}>
                        <Avatar />
                    </group>
                    
                    {/* CHANGED: Adjusted target so camera looks at the face (0.5), not the feet */}
                    <OrbitControls enableZoom={false} enablePan={false} target={[0, 0.5, 0]} />
                </Canvas>
            </div>

            {/* LAYER 2: UI OVERLAY */}
            <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%', 
                zIndex: 10, 
                pointerEvents: 'none', 
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '40px'
            }}>
                
                {/* Transcript Area */}
                <div style={{ 
                    marginBottom: '20px', 
                    textAlign: 'center', 
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}>
                    <div style={{ height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {vad.listening && !isTalking && (
                            <span style={{ color: '#00ffff', fontFamily: 'monospace', letterSpacing: '2px' }}>
                                ● LISTENING
                            </span>
                        )}
                    </div>

                    {transcript.slice(-2).map((line, i) => (
                        <div key={i} style={{ 
                            background: 'rgba(0,0,0,0.6)', 
                            border: '1px solid rgba(255,255,255,0.2)', 
                            padding: '10px 20px', 
                            borderRadius: '15px', 
                            marginTop: '10px',
                            color: 'white',
                            fontFamily: 'sans-serif'
                        }}>
                            {line}
                        </div>
                    ))}
                </div>

                {/* Bottom Control Bar */}
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-end',
                    pointerEvents: 'auto', 
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    paddingTop: '20px',
                    marginBottom: '15vh' 
                }}>
                    
                    {/* Left: Title */}
                    <div>
                        <h1 style={{ 
                            color: 'white', 
                            fontSize: '2rem', 
                            fontWeight: 'bold', 
                            fontFamily: 'monospace', 
                            margin: 0 
                        }}>
                            CEN<span style={{ color: '#00ffff' }}>.AI</span>
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                            <div style={{ 
                                width: '10px', 
                                height: '10px', 
                                borderRadius: '50%', 
                                backgroundColor: isConnected ? '#00ffff' : '#ff4444' 
                            }} />
                            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontFamily: 'monospace' }}>
                                {isConnected ? "SYSTEM ONLINE" : "DISCONNECTED"}
                            </span>
                        </div>
                    </div>

                    {/* Right: Button */}
                    {/* CHANGED: Added marginRight: '80px' to push it to the left */}
                    <div style={{ marginRight: '80px' }}>
                        {!sessionStarted ? (
                            <button
                                onClick={startSession}
                                style={{
                                    backgroundColor: '#00ffff',
                                    color: 'black',
                                    border: 'none',
                                    padding: '15px 40px',
                                    borderRadius: '50px',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    boxShadow: '0 0 20px rgba(0,255,255,0.4)'
                                }}
                            >
                                INITIALIZE
                            </button>
                        ) : (
                             <div style={{ color: '#00ffff', fontFamily: 'monospace' }}>
                                ● SESSION ACTIVE
                             </div>
                        )}
                    </div>

                </div>
            </div>
        </main>
    );
}