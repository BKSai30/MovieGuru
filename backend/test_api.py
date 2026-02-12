import requests
import os

OMDB_API_KEY = "2e4979df"
OMDB_URL = "http://www.omdbapi.com/"
GEMINI_API_KEY = "AIzaSyBeFo-MvcIzMFjb9iJA4y6KZRsDCaDZKl8"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"

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
