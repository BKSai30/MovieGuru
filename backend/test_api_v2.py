import requests
import json

import os
from dotenv import load_dotenv
load_dotenv()

OMDB_API_KEY = os.getenv("OMDB_API_KEY")
OMDB_URL = "http://www.omdbapi.com/"

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("Warning: GEMINI_API_KEY not found in .env")

# Use correct model
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"

def test_start():
    print("Beginning tests...")

    print("\n--- OMDb TEST ---")
    try:
        res = requests.get(OMDB_URL, params={'apikey': OMDB_API_KEY, 's': 'matrix'})
        print(f"OMDb Status: {res.status_code}")
        print(f"OMDb Response: {res.text[:100]}...")
    except Exception as e:
        print(f"OMDb Exception: {e}")

    print("\n--- GEMINI TEST ---")
    try:
        payload = {"contents": [{"parts": [{"text": "Hello"}]}]}
        res = requests.post(GEMINI_URL, json=payload, headers={"Content-Type": "application/json"})
        print(f"Gemini Status: {res.status_code}")
        print(f"Gemini Response: {res.text[:150]}...")
    except Exception as e:
        print(f"Gemini Exception: {e}")

if __name__ == "__main__":
    test_start()
