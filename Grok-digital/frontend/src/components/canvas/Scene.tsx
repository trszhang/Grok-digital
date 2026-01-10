"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, ContactShadows } from "@react-three/drei";
import { Avatar } from "@/components/canvas/Avatar";

export function Scene() {
  return (
    <div className="h-full w-full">
      <Canvas camera={{ position: [0, 0, 1.5], fov: 50 }}>
        {/* Lighting Setup */}
        <ambientLight intensity={0.6} />
        <spotLight 
          position={[5, 10, 5]} 
          angle={0.15} 
          penumbra={1} 
          intensity={1.5} 
          castShadow 
        />
        <pointLight position={[-5, 5, -5]} intensity={0.5} color="#blue" />

        {/* The 3D Avatar */}
        <group position={[0, -1.6, 0]}>
          <Avatar />
        </group>

        {/* Environment & Effects */}
        <Environment preset="city" />
        <ContactShadows opacity={0.7} />
        
        {/* Controls (disable zoom/pan for fixed view) */}
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          minPolarAngle={Math.PI / 2.2} 
          maxPolarAngle={Math.PI / 2.2} 
        />
      </Canvas>
    </div>
  );
}