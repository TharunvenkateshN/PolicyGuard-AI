import requests
import json

url = "http://localhost:8000/api/v1/chat"
headers = {"Content-Type": "application/json"}
data = {
    "message": "What kind of data requires encryption?",
    "history": []
}

try:
    print(f"Sending message: {data['message']}")
    response = requests.post(url, json=data)
    response.raise_for_status()
    
    result = response.json()
    print("\n--- AI Response ---")
    print(result['answer'])
    print("\n--- Citations ---")
    print("\n".join(result['citations']))
    
except Exception as e:
    print(f"Error: {e}")
    if 'response' in locals():
        print(response.text)
