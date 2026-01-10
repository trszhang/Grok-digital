import io
import os
from openai import OpenAI

class STTService:
    def __init__(self):
        # We use OpenAI Whisper for high-accuracy cloud transcription
        # Alternatively, you can use 'faster-whisper' for local inference
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    async def transcribe(self, audio_bytes: bytes) -> str:
        try:
            # Create a file-like object for the API
            audio_file = io.BytesIO(audio_bytes)
            audio_file.name = "input.wav"

            transcription = self.client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="en"
            )
            return transcription.text
        except Exception as e:
            print(f"Transcription Error: {e}")
            return ""