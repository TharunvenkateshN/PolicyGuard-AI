
import requests
import json
import os

API_KEY = "AIzaSyAJXtebd2DqlfQNvqYB0mHCyJTUOP8vyco"

print(f"Testing API Key: {API_KEY[:5]}...{API_KEY[-5:]}")

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={API_KEY}"
headers = {'Content-Type': 'application/json'}
data = {
    "contents": [{"parts": [{"text": "Hello, are you working?"}]}]
}

try:
    print(f"Sending request to {url.split('?')[0]}...")
    response = requests.post(url, headers=headers, json=data)
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("SUCCESS! API Key is valid.")
        print("Response:", response.json())
    else:
        print("FAILURE! API Key rejected.")
        print("Response:", response.text)

except Exception as e:
    print(f"Exception during request: {e}")
