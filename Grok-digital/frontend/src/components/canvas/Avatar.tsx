"use client";
import React, { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { audioSystem } from "@/lib/audio/AudioQueue";
import { mapCharToViseme } from "@/lib/utils/visemeMap";

const MODEL_URL = "/models/avatar.glb"; // Ensure this file exists in public/models

export function Avatar() {
  const { scene } = useGLTF(MODEL_URL);
  const headMesh = useRef<THREE.Mesh>();
  const morphDict = useRef<Record<string, number>>({});

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).morphTargetDictionary && child.name.includes("Head")) {
        headMesh.current = child as THREE.Mesh;
        morphDict.current = headMesh.current.morphTargetDictionary!;
      }
    });
  }, [scene]);

  useFrame(() => {
    if (!headMesh.current || !morphDict.current) return;

    const now = audioSystem.getCurrentTime();
    
    // Find the active viseme at this exact timestamp
    const activeEvent = audioSystem.visemeEvents.find(
        v => now >= v.time && now < v.time + v.duration
    );

    // Clean up old events to prevent memory leak
    if (Math.random() > 0.95) {
         audioSystem.visemeEvents = audioSystem.visemeEvents.filter(v => v.time + v.duration > now);
    }

    const targetViseme = activeEvent ? mapCharToViseme(activeEvent.char) : 'viseme_sil';

    // Apply Blendshapes with Lerp for smoothness
    Object.keys(morphDict.current).forEach((key) => {
        const index = morphDict.current[key];
        const targetValue = (key === targetViseme) ? 1.0 : 0.0;
        const current = headMesh.current!.morphTargetInfluences![index];
        
        // Speed of interpolation (0.2 = smooth, 0.5 = snappy)
        headMesh.current!.morphTargetInfluences![index] = THREE.MathUtils.lerp(current, targetValue, 0.25);
    });
  });

  return <primitive object={scene} position={[0, -1.6, 0]} />;
}