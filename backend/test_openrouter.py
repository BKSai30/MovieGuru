
import requests
import os
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if OPENROUTER_API_KEY:
    OPENROUTER_API_KEY = OPENROUTER_API_KEY.strip().replace('"', '').replace("'", "")

print(f"Testing OpenRouter API with Key: {OPENROUTER_API_KEY[:5]}...{OPENROUTER_API_KEY[-5:] if OPENROUTER_API_KEY else 'None'}")

if not OPENROUTER_API_KEY or "YOUR_OPENROUTER_API_KEY" in OPENROUTER_API_KEY:
    print("Error: OPENROUTER_API_KEY not found or is placeholder.")
    exit(1)

url = "https://openrouter.ai/api/v1/chat/completions"
headers = {
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {OPENROUTER_API_KEY}',
    'HTTP-Referer': 'http://localhost:5173',
    'X-Title': 'MovieGuru'
}

# Models to try (Free tier)
models_to_try = [
    "openrouter/free",
    "google/gemini-2.0-flash-exp:free",
    "google/gemini-2.0-pro-exp-02-05:free", # Retrying just in case
    "mistralai/mistral-7b-instruct-v0.3:free"
]

with open("openrouter_debug_utf8.txt", "w", encoding="utf-8") as f:
    for model in models_to_try:
        msg = f"\nTesting model: {model}"
        print(msg)
        f.write(msg + "\n")
        f.flush()
        
        payload = {
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Hello, suggest one sci-fi movie."}
            ],
            "model": model,
            "stream": False,
            "temperature": 0.7
        }
        
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
