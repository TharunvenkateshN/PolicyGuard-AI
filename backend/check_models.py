from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

try:
    print("Listing models...")
    for m in client.models.list(config={"page_size": 100}):
        print(f"Model: {m.name} | Display: {m.display_name}")
except Exception as e:
    print(f"Error: {e}")
