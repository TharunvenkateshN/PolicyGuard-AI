import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("Error: GOOGLE_API_KEY not found.")
    exit(1)

client = genai.Client(api_key=api_key)

try:
    with open("models_list_utf8.txt", "w", encoding="utf-8") as f:
        f.write("Listing available models...\n")
        args = {} # Arguments for list_models if needed
        # Newer SDKs might use a pager or iterator.
        for model in client.models.list():
            f.write(f"Model Name: {model.name}\n")
            if hasattr(model, 'display_name'):
                f.write(f"  DisplayName: {model.display_name}\n")
            if hasattr(model, 'supported_generation_methods'):
                 f.write(f"  SupportedMethods: {model.supported_generation_methods}\n")
            f.write("-" * 20 + "\n")
    print("Models written to models_list_utf8.txt")

except Exception as e:
    print(f"Error listing models: {e}")
    with open("models_list_utf8.txt", "w", encoding="utf-8") as f:
         f.write(f"Error: {e}")
