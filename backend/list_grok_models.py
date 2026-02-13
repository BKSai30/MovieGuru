
import requests
import os
from dotenv import load_dotenv

load_dotenv()

GROK_API_KEY = os.getenv("GROK_API_KEY")
if GROK_API_KEY:
    GROK_API_KEY = GROK_API_KEY.strip().replace('"', '').replace("'", "")

if not GROK_API_KEY or "YOUR_GROK_API_KEY" in GROK_API_KEY:
    print("Error: GROK_API_KEY not found.")
    exit(1)

url = "https://api.x.ai/v1/models"
headers = {
    'Authorization': f'Bearer {GROK_API_KEY}'
}

with open("models_output_utf8.txt", "w", encoding="utf-8") as f:
    try:
        print("Listing models...")
        f.write("Listing models...\n")
        response = requests.get(url, headers=headers)
        msg = f"Status Code: {response.status_code}"
        print(msg)
        f.write(msg + "\n")
        
        if response.status_code == 200:
            models = response.json()['data']
            for m in models:
                line = f"- {m['id']}"
                print(line)
                f.write(line + "\n")
        else:
            print(f"Error: {response.text}")
            f.write(f"Error: {response.text}\n")
    except Exception as e:
        print(f"Exception: {e}")
        f.write(f"Exception: {e}\n")
