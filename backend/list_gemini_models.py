import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

with open('clean_models.txt', 'w', encoding='utf-8') as f:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            name = m.name.replace('models/', '')
            f.write(name + '\n')
print("Done writing models.")
