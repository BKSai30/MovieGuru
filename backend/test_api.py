import requests
import os

from dotenv import load_dotenv
load_dotenv()

OMDB_API_KEY = os.getenv("OMDB_API_KEY")
# Ensure we have a default OMDB URL if not in env (though env has just keys usually)
OMDB_URL = "http://www.omdbapi.com/"

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("Warning: GEMINI_API_KEY not found in .env")

# Use correct model
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"

def test_omdb(search_term):
    print(f"Testing OMDb with search: {search_term}")
    params = {'apikey': OMDB_API_KEY, 's': search_term}
    try:
        res = requests.get(OMDB_URL, params=params)
        print(f"Status: {res.status_code}")
        print(f"Body: {res.text[:200]}")
    except Exception as e:
        print(f"Error: {e}")

def test_gemini():
    print(f"Testing Gemini...")
    payload = {"contents": [{"parts": [{"text": "Hello"}]}]}
    headers = {"Content-Type": "application/json"}
    try:
        res = requests.post(GEMINI_URL, json=payload, headers=headers)
        print(f"Status: {res.status_code}")
        print(f"Body: {res.text[:200]}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_omdb("happy")
    print("-" * 20)
    test_gemini()
