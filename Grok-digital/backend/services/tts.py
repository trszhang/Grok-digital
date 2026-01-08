import os
import json
import base64
import asyncio
import websockets
from typing import AsyncGenerator

class TTSService:
    def __init__(self):
        self.api_key = os.getenv("ELEVENLABS_API_KEY")
        self.voice_id = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")
        self.model = "eleven_turbo_v2_5"

    async def stream_audio(self, text_iterator: AsyncGenerator[str, None]):
        """
        Consumes text stream, yields dicts of { audio: bytes, visemes: dict }
        """
        uri = f"wss://api.elevenlabs.io/v1/text-to-speech/{self.voice_id}/stream-input?model_id={self.model}"
        
        async with websockets.connect(uri) as ws:
            # Init Packet
            await ws.send(json.dumps({
                "text": " ",
                "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
                "xi_api_key": self.api_key
            }))

            # Task: Send Text
            async def sender():
                async for text in text_iterator:
                    await ws.send(json.dumps({"text": text, "try_trigger_generation": True}))
                await ws.send(json.dumps({"text": ""})) # EOS

            sender_task = asyncio.create_task(sender())

            # Loop: Receive Audio
            while True:
                try:
                    response = await ws.recv()
                    data = json.loads(response)

                    if data.get("audio"):
                        yield {
                            "audio": data["audio"], # Base64 string from API
                            "visemes": data.get("alignment") # Pass through alignment data
                        }
                    
                    if data.get("isFinal"):
                        break
                except websockets.exceptions.ConnectionClosed:
                    break