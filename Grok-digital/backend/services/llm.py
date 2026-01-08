import os
from openai import OpenAI

class GrokService:
    def __init__(self):
        self.client = OpenAI(
            api_key=os.getenv("XAI_API_KEY"),
            base_url="https://api.x.ai/v1"
        )
        self.system_prompt = """
        You are a digital human interface. You are efficient, knowledgeable, and slightly witty.
        Constraints:
        1. Output text suitable for speech (avoid markdown like **bold** or lists).
        2. Keep responses concise (under 3 sentences) unless asked for details.
        """

    def generate_stream(self, messages):
        # Ensure system prompt is present
        if not messages or messages[0]["role"] != "system":
            messages.insert(0, {"role": "system", "content": self.system_prompt})

        stream = self.client.chat.completions.create(
            model="grok-beta",
            messages=messages,
            stream=True,
            temperature=0.7
        )

        for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content