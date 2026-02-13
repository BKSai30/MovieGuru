
import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API key
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Sanitize key
if OPENROUTER_API_KEY:
    OPENROUTER_API_KEY = OPENROUTER_API_KEY.strip().replace('"', '').replace("'", "")

print(f"Testing OpenRouter API")
print(f"API Key found: {'Yes' if OPENROUTER_API_KEY else 'No'}")
if OPENROUTER_API_KEY:
    print(f"Key preview: {OPENROUTER_API_KEY[:10]}...{OPENROUTER_API_KEY[-5:]}")

# Models to try (Free tier)
models_to_try = [
    "openrouter/free",
    "google/gemini-2.0-flash-exp:free",
    "google/gemini-2.0-pro-exp-02-05:free", # Retrying just in case
    "mistralai/mistral-7b-instruct-v0.3:free"
]

with open("openrouter_debug_utf8.txt", "w", encoding="utf-8") as f:
    f.write("") # Clear file

for model in models_to_try:
    print(f"\nTesting model: {model}")
    
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {OPENROUTER_API_KEY}',
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'MovieGuru'
    }
    payload = {
        "messages": [
            {"role": "user", "content": "Suggest one sci-fi movie. format: json with title and reason."}
        ],
        "model": model,
        "temperature": 0.7
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        print(f"Status Code: {response.status_code}")
        
        with open("openrouter_debug_utf8.txt", "a", encoding="utf-8") as f:
            f.write(f"\nTesting model: {model}\n")
            f.write(f"Status Code: {response.status_code}\n")

        if response.status_code == 200:
            content = response.json()['choices'][0]['message']['content']
            print(f"Success with {model}!")
            print(content)
            with open("openrouter_debug_utf8.txt", "a", encoding="utf-8") as f:
                f.write(f"Success with {model}!\n")
                f.write(content + "\n")
            break # Stop after first success
        else:
            print(f"Error: {response.text}")
            with open("openrouter_debug_utf8.txt", "a", encoding="utf-8") as f:
                f.write(f"Error: {response.text}\n")
                
    except Exception as e:
        print(f"Exception: {e}")
