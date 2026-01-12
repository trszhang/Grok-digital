import { useState, useCallback } from "react";
import { useMicVAD } from "@ricky0123/vad-react";
import { useStore } from "@/store/useStore";

export const useVAD = (onSpeechEndCallback: (audio: Float32Array) => void) => {
  const { setUserTalking, setTalking } = useStore();
  const [errored, setErrored] = useState(false);

  const vad = useMicVAD({
    startOnLoad: false, // Wait for user to click "Start"
    workletURL: "/vad.worklet.bundle.min.js",
    modelURL: "/silero_vad.onnx",
    
    onSpeechStart: () => {
      console.log("User started speaking");
      setUserTalking(true);
      // Optional: Interrupt the AI if it's currently speaking
      setTalking(false); 
    },
    
    onSpeechEnd: (audio) => {
      console.log("User finished speaking");
      setUserTalking(false);
      onSpeechEndCallback(audio);
    },
    
    onVADMisfire: () => {
      console.log("VAD Misfire (noise detected)");
      setUserTalking(false);
    },
    
    onError: (e) => {
      console.error("VAD Error:", e);
      setErrored(true);
    }
  });

  return { ...vad, errored };
};