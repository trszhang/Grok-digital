import asyncio
from services.llm import GrokService
from services.tts import TTSService
from services.stt import STTService  

class Orchestrator:
    def __init__(self, websocket):
        self.ws = websocket
        self.llm = GrokService()
        self.tts = TTSService()
        self.stt = STTService()      
        self.history = []

    async def handle_message(self, data, is_binary=False):
        user_text = ""

        if is_binary:
            # 1. Transcribe Audio -> Text
            print("Processing audio...")
            user_text = await self.stt.transcribe(data)
            if not user_text.strip():
                return
            # Optional: Send transcription back to UI
            await self.ws.send_json({"type": "transcription", "content": user_text})
        else:
            user_text = data

        print(f"User Said: {user_text}")
        await self.process_turn(user_text)

    async def process_turn(self, user_text: str):
        self.history.append({"role": "user", "content": user_text})
        
        # Async generator adapter
        async def text_gen_adapter():
            for chunk in self.llm.generate_stream(self.history):
                await self.ws.send_json({"type": "text", "content": chunk})
                yield chunk
        
        # TTS Pipeline
        audio_generator = self.tts.stream_audio(text_gen_adapter())
        
        try:
            async for packet in audio_generator:
                await self.ws.send_json({
                    "type": "audio",
                    "payload": packet["audio"],
                    "visemes": packet["visemes"]
                })
        except Exception as e:
            print(f"Streaming error: {e}")

        await self.ws.send_json({"type": "status", "content": "turn_complete"})