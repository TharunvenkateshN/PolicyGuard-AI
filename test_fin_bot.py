import requests
import json

try:
    response = requests.post(
        "http://localhost:8001/chat",
        json={"message": "Hello", "conversation_id": "test-1"}
    )
    print(f"Status Code: {response.status_code}")
    print("Response JSON:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
