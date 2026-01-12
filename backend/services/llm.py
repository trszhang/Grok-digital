import os
from openai import OpenAI

class LLMService:
    def __init__(self):
        # We remove the 'base_url' to default back to OpenAI's official servers
        self.client = OpenAI(
            api_key=os.getenv("OPENAI_API_KEY")
        )
        
        self.system_prompt = """
        你是澄澜AI的专属数字人，你热情，有知识。
        """

    def generate_stream(self, messages):
        # Ensure system prompt is present at the start
        if not messages or messages[0]["role"] != "system":
            messages.insert(0, {"role": "system", "content": self.system_prompt})

        stream = self.client.chat.completions.create(
            model="gpt-4o", # Switched from "grok-beta" to "gpt-4o"
            messages=messages,
            stream=True,
            temperature=0.7
        )

        for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content