import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

with open("final_model_list.txt", "w", encoding="utf-8") as f:
    f.write("--- AVAILABLE MODELS ---\n")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            f.write(f"{m.name}\n")
    f.write("------------------------\n")
