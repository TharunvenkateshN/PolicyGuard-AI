from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

try:
    with open("models.txt", "w") as f:
        f.write("Listing Gemini models...\n")
        for m in client.models.list(config={"page_size": 100}):
            f.write(f"Model ID: {m.name}\n")
    print("Saved to models.txt")
except Exception as e:
    print(f"Error: {e}")
