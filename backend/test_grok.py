
import requests
import os
from dotenv import load_dotenv

load_dotenv()

GROK_API_KEY = os.getenv("GROK_API_KEY")
if GROK_API_KEY:
    GROK_API_KEY = GROK_API_KEY.strip().replace('"', '').replace("'", "")

print(f"Testing Grok API with Key: {GROK_API_KEY[:5]}...{GROK_API_KEY[-5:] if GROK_API_KEY else 'None'}")

if not GROK_API_KEY or "YOUR_GROK_API_KEY" in GROK_API_KEY:
    print("Error: GROK_API_KEY not found or is placeholder.")
    exit(1)

url = "https://api.x.ai/v1/chat/completions"
headers = {
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {GROK_API_KEY}'
}
payload = {
    "messages": [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello, suggest one sci-fi movie."}
    ],
    "model": "grok-2-latest",
    "stream": False,
    "temperature": 0.7
}

models_to_try = ["grok-2", "grok-2-latest", "grok-beta", "grok-2-1212"]

with open("debug_output_utf8.txt", "w", encoding="utf-8") as f:
    for model in models_to_try:
        msg = f"\nTesting model: {model}"
        print(msg)
        f.write(msg + "\n")
        
        payload["model"] = model
        try:
            response = requests.post(url, headers=headers, json=payload)
            msg = f"Status Code: {response.status_code}"
            print(msg)
            f.write(msg + "\n")
            
            if response.status_code == 200:
                print(f"Success with {model}!")
                content = response.json()['choices'][0]['message']['content']
                print(content)
                f.write(f"Success with {model}!\n{content}\n")
                break
            else:
                try:
                    err_text = response.text
                except:
                    err_text = "Could not decode response text"
                print(f"Error with {model}: {response.status_code} - {err_text}")
                f.write(f"Error with {model}: {response.status_code} - {err_text}\n")
        except Exception as e:
            print(f"Request Exception with {model}: {e}")
            f.write(f"Request Exception with {model}: {e}\n")
