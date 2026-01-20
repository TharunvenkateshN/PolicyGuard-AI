import google.generativeai as genai
import os
from dotenv import load_dotenv
import asyncio

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=api_key)

model_name = "models/gemini-exp-1206"

async def test():
    print(f"Testing model: {model_name}...")
    try:
        model = genai.GenerativeModel(model_name)
        response = await model.generate_content_async("Hello, are you working?")
        print(f"Success! Response: {response.text}")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test())
