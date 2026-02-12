import requests
import json

OMDB_API_KEY = "2e4979df"
OMDB_URL = "http://www.omdbapi.com/"
GEMINI_API_KEY = "AIzaSyBeFo-MvcIzMFjb9iJA4y6KZRsDCaDZKl8"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"

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
