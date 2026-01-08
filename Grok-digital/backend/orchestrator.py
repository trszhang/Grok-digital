import asyncio
from services.llm import GrokService
from services.tts import TTSService

class Orchestrator:
    def __init__(self, websocket):
        self.ws = websocket
        self.llm = GrokService()
        self.tts = TTSService()
        self.history = []

    async def process_user_input(self, user_text: str):
        # 1. Update History
        self.history.append({"role": "user", "content": user_text})
        
        # 2. Text Generation Generator
        # We need an async generator wrapper for the synchronous OpenAI stream if needed, 
        # or use OpenAI's async client. For simplicity, we adapt:
        async def text_gen_adapter():
            for chunk in self.llm.generate_stream(self.history):
                # Send text to frontend immediately for subtitle/log
                await self.ws.send_json({"type": "text", "content": chunk})
                yield chunk
        
        # 3. Audio Synthesis Pipeline
        audio_generator = self.tts.stream_audio(text_gen_adapter())
        
        full_response_text = ""
        
        try:
            async for packet in audio_generator:
                # Packet contains b64 audio and viseme data
                await self.ws.send_json({
                    "type": "audio",
                    "payload": packet["audio"],
                    "visemes": packet["visemes"]
                })
        except Exception as e:
            print(f"Streaming error: {e}")

        # 4. Finalize
        await self.ws.send_json({"type": "status", "content": "turn_complete"})