
import os
import sqlite3
import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
TMDB_API_KEY = os.getenv("TMDB_API_KEY") # Keep for fallback
OMDB_API_KEY = os.getenv("OMDB_API_KEY")

# Sanitize keys (remove quotes if present)
if OPENROUTER_API_KEY: OPENROUTER_API_KEY = OPENROUTER_API_KEY.strip().replace('"', '').replace("'", "")
if OMDB_API_KEY: OMDB_API_KEY = OMDB_API_KEY.strip().replace('"', '').replace("'", "")
if TMDB_API_KEY: TMDB_API_KEY = TMDB_API_KEY.strip().replace('"', '').replace("'", "")

print(f"DEBUG: Loaded OpenRouter Key: {OPENROUTER_API_KEY[:5]}...{OPENROUTER_API_KEY[-5:] if OPENROUTER_API_KEY else 'None'}")
print(f"DEBUG: Loaded OMDb Key: {OMDB_API_KEY}")

if not OPENROUTER_API_KEY:
    print("CRITICAL WARNING: OPENROUTER_API_KEY is missing from environment!")

TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"
OMDB_URL = "http://www.omdbapi.com/"

# Users File
USERS_FILE = 'users.json'

def load_users():
    if not os.path.exists(USERS_FILE):
        return {}
    try:
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    except:
        return {}

def save_users(users):
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=4)

# Initialize DB (Keeping for search history if needed, but primary auth is JSON now)
def get_db_connection():
    conn = sqlite3.connect('movieguru.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    c.executescript('''
        CREATE TABLE IF NOT EXISTS search_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mood TEXT NOT NULL,
            result_count INTEGER,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    ''')
    conn.commit()
    conn.close()
    print("Database connected and initialized.")

init_db()

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400
        
    users = load_users()
    if email in users:
        return jsonify({'error': 'User already exists'}), 400
        
    users[email] = {
        'password': password, # In production, HASH THIS!
        'favorites': []
    }
    save_users(users)
    return jsonify({'email': email, 'favorites': []})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    users = load_users()
    user = users.get(email)
    
    if not user or user['password'] != password:
        return jsonify({'error': 'Invalid credentials'}), 401
        
    return jsonify({'email': email, 'favorites': user.get('favorites', [])})

def get_mock_movies():
    return [
        {
            "id": 27205,
            "title": "Inception",
            "poster_path": "/8Z8dptZQl1qWhIdHgtiKTfIv1HQ.jpg",
            "release_date": "2010-07-15",
            "overview": "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible: \"inception\", the implantation of another person's idea into a target's subconscious.",
            "vote_average": 8.4
        },
        {
            "id": 157336,
            "title": "Interstellar",
            "poster_path": "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
            "release_date": "2014-11-05",
            "overview": "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.",
            "vote_average": 8.4
        },
        {
            "id": 155,
            "title": "The Dark Knight",
            "poster_path": "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
            "release_date": "2008-07-14",
            "overview": "Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets. The partnership proves to be effective, but they soon find themselves prey to a reign of chaos unleashed by a rising criminal mastermind known to the terrified citizens of Gotham as the Joker.",
            "vote_average": 8.5
        }
    ]

@app.route('/api/recommend', methods=['POST'])
def recommend():
    data = request.json
    mood = data.get('mood')
    if not mood:
        return jsonify({'error': 'Mood is required'}), 400

    movies = []
    explanation = ""

    print(f"DEBUG: Processing mood: {mood}")

    # Check which API to use for metadata
    # We consider TMDB key valid if it's not the placeholder and has some length
    use_tmdb = TMDB_API_KEY and len(TMDB_API_KEY) > 20 and "YOUR_TMDB_API_KEY" not in TMDB_API_KEY
    print(f"DEBUG: Using TMDB: {use_tmdb}, Using OMDb: {bool(OMDB_API_KEY)}")

    # Strategy 1: AI-Powered Recommendation (OpenRouter - Grok)
    if OPENROUTER_API_KEY:
        try:
            print("DEBUG: Asking OpenRouter (Grok) for recommendations...")
            
            prompt = f"""
            Act as a movie expert. The user is feeling: "{mood}".
            Suggest 5 movies that perfectly match this emotional state or theme.
            For each movie, provide:
            1. The exact movie title.
            2. A short, 1-sentence explanation of why it fits this specific mood.
            
            Return ONLY a raw JSON array of objects. Do not use markdown code blocks.
            Format:
            [
                {{"title": "Movie Title 1", "reason": "Explanation 1"}},
                {{"title": "Movie Title 2", "reason": "Explanation 2"}}
            ]
            """

            # Models to try (Free tier)
            models_to_try = [
                "openrouter/free",
                "google/gemini-2.0-flash-exp:free",
                "mistralai/mistral-7b-instruct:free"
            ]

            success = False
            for model in models_to_try:
                try:
                    print(f"DEBUG: Trying OpenRouter model: {model}")
                    
                    # Call OpenRouter API
                    url = "https://openrouter.ai/api/v1/chat/completions"
                    headers = {
                        'Content-Type': 'application/json',
                        'Authorization': f'Bearer {OPENROUTER_API_KEY}',
                        'HTTP-Referer': 'http://localhost:5173',  # Client URL
                        'X-Title': 'MovieGuru'
                    }
                    payload = {
                        "messages": [
                            {"role": "system", "content": "You are a helpful movie expert."},
                            {"role": "user", "content": prompt}
                        ],
                        "model": model,
                        "stream": False,
                        "temperature": 0.7
                    }
                    
                    response = requests.post(url, headers=headers, json=payload)
                    
                    if response.status_code == 200:
                        data = response.json()
                        text_content = data['choices'][0]['message']['content']
                        
                        try:
                            clean_json = text_content.replace('```json', '').replace('```', '').strip()
                            try:
                                recommendations = json.loads(clean_json)
                            except:
                                # Regex fallback
                                import re
                                match = re.search(r'\[.*\]', clean_json, re.DOTALL)
                                if match:
                                    recommendations = json.loads(match.group(0))
                                else:
                                    raise Exception("Could not find JSON in response")
                            
                            print(f"DEBUG: {model} suggested: {[r.get('title') for r in recommendations]}")
                            
                            explanation = f"Here are some picks for your mood: '{mood}'"

                            # Fetch details
                            for rec in recommendations:
                                title = rec.get('title')
                                reason = rec.get('reason')
                                
                                # Use TMDB if valid, else OMDb
                                if use_tmdb:
                                     try:
                                        search_url = f"{TMDB_BASE_URL}/search/movie"
                                        params = {
                                            'api_key': TMDB_API_KEY,
                                            'query': title,
                                            'language': 'en-US',
                                            'page': 1,
                                            'include_adult': 'false'
                                        }
                                        tmdb_res = requests.get(search_url, params=params)
                                        
                                        if tmdb_res.status_code == 200:
                                            results = tmdb_res.json().get('results', [])
                                            if results:
                                                movie_data = results[0]
                                                movies.append({
                                                    'id': movie_data.get('id'),
                                                    'title': movie_data.get('title'),
                                                    'poster_path': movie_data.get('poster_path'),
                                                    'release_date': movie_data.get('release_date', ''),
                                                    'overview': movie_data.get('overview'),
                                                    'ai_reason': reason, 
                                                    'vote_average': movie_data.get('vote_average', 0),
                                                    'original_language': movie_data.get('original_language')
                                                })
                                     except Exception as tmdb_err:
                                        print(f"TMDB fetch error for {title}: {tmdb_err}")
                                
                                elif OMDB_API_KEY:
                                    try:
                                        omdb_res = requests.get(OMDB_URL, params={'apikey': OMDB_API_KEY, 't': title})
                                        if omdb_res.status_code == 200:
                                            details = omdb_res.json()
                                            if details.get('Response') == 'True':
                                                imdb_id = details.get('imdbID', '0')
                                                try:
                                                    db_id = int(imdb_id.replace('tt', ''))
                                                except:
                                                    db_id = abs(hash(imdb_id)) % 100000000
                                                    
                                                movies.append({
                                                    'id': db_id,
                                                    'title': details.get('Title'),
                                                    'poster_path': details.get('Poster'),
                                                    'release_date': details.get('Released', details.get('Year')),
                                                    'overview': details.get('Plot'),
                                                    'ai_reason': reason,
                                                    'vote_average': float(details.get('imdbRating', 0) if details.get('imdbRating') != 'N/A' else 0),
                                                    'imdb_id': imdb_id
                                                })
                                    except Exception as omdb_err:
                                        print(f"OMDb fetch error for {title}: {omdb_err}")
                            
                        except json.JSONDecodeError as json_err:
                            print(f"JSON Parse Error: {json_err} - Raw text: {text_content}")
                            explanation = "AI response was malformed."
                        
                        success = True
                        break # Exit loop on success

                    else:
                        print(f"OpenRouter API failed with {model}: {response.status_code} - {response.text}")
                        # Continue to next model
                
                except Exception as e:
                    print(f"Request Exception with {model}: {e}")
                    # Continue to next model

            if not success:
                 explanation = "AI services temporarily unavailable."
        except Exception as outer_e:
             print(f"AI Setup Error: {outer_e}")

    # Strategy 2: Fallback to Keyword Search
    if not movies:
        print(f"DEBUG: Falling back to keyword search for: {mood}")
        if use_tmdb:
            try:
                discover_url = f"{TMDB_BASE_URL}/search/movie"
                params = {'api_key': TMDB_API_KEY, 'query': mood, 'include_adult': 'false'}
                tmdb_res = requests.get(discover_url, params=params)
                if tmdb_res.status_code == 200:
                    results = tmdb_res.json().get('results', [])
                    if results:
                        explanation = f"No specific AI recommendations found, but these match '{mood}'."
                        for item in results[:5]:
                            movies.append({
                                'id': item.get('id'),
                                'title': item.get('title'),
                                'poster_path': item.get('poster_path'),
                                'release_date': item.get('release_date', ''),
                                'overview': item.get('overview'),
                                'vote_average': item.get('vote_average', 0)
                            })
            except Exception as e:
                print(f"TMDB Fallback Error: {e}")
        elif OMDB_API_KEY:
            try:
                omdb_res = requests.get(OMDB_URL, params={'apikey': OMDB_API_KEY, 's': mood, 'type': 'movie'})
                if omdb_res.status_code == 200:
                    data = omdb_res.json()
                    if data.get('Response') == 'True':
                        explanation = f"Start with these movies for '{mood}'."
                        for item in data.get('Search', [])[:5]:
                            det_res = requests.get(OMDB_URL, params={'apikey': OMDB_API_KEY, 'i': item['imdbID']})
                            if det_res.status_code == 200:
                                det = det_res.json()
                                movies.append({
                                    'id': abs(hash(item['imdbID'])) % 100000,
                                    'title': det.get('Title'),
                                    'poster_path': det.get('Poster'),
                                    'release_date': det.get('Released'),
                                    'overview': det.get('Plot'),
                                    'vote_average': float(det.get('imdbRating', 0) if det.get('imdbRating') != 'N/A' else 0)
                                })
            except Exception as e:
                print(f"OMDb Fallback Error: {e}")
    
    # Strategy 3: Mock Data
    if not movies:
        movies = get_mock_movies()
        explanation = "We couldn't connect services, but try these favorites!"

    try:
        conn = get_db_connection()
        conn.execute('INSERT INTO search_history (mood, result_count) VALUES (?, ?)', (mood, len(movies)))
        conn.commit()
        conn.close()
    except Exception as db_err:
        print(f"DB Error: {db_err}")

    return jsonify({
        'mood': mood,
        'explanation': explanation,
        'movies': movies
    })

@app.route('/api/movie/<int:movie_id>/providers', methods=['GET'])
def get_providers(movie_id):
    if not TMDB_API_KEY or "YOUR_TMDB_API_KEY" in TMDB_API_KEY:
        return jsonify({'error': 'TMDB API Key missing'}), 500
    
    try:
        url = f"{TMDB_BASE_URL}/movie/{movie_id}/watch/providers"
        params = {'api_key': TMDB_API_KEY}
        response = requests.get(url, params=params)
        
        if response.status_code == 200:
            data = response.json()
            results = data.get('results', {})
            # Default to US, or make it dynamic if we had user location
            us_providers = results.get('US', {})
            return jsonify(us_providers)
        else:
            return jsonify({'error': 'Failed to fetch providers'}), response.status_code
            
    except Exception as e:
        print(f"Provider Fetch Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/favorites', methods=['POST'])
def favorites():
    data = request.json
    email = data.get('email')
    
    if not email:
        return jsonify({'error': 'Email required'}), 400

    users = load_users()
    user = users.get(email)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Action: Get Favorites
    if data.get('action') == 'get':
         return jsonify(user.get('favorites', []))

    # Action: Toggle Favorite
    movie = data.get('movie')
    if not movie:
         return jsonify({'error': 'Movie data required'}), 400
         
    current_favs = user.get('favorites', [])
    
    # Check if exists
    existing_index = next((index for (index, d) in enumerate(current_favs) if d["id"] == movie["id"]), None)
    
    if existing_index is not None:
        current_favs.pop(existing_index)
        status = 'removed'
    else:
        current_favs.append(movie)
        status = 'added'
        
    user['favorites'] = current_favs
    users[email] = user
    save_users(users)
    
    return jsonify({'status': status, 'favorites': current_favs})

@app.route('/api/history', methods=['GET'])
def history():
    conn = get_db_connection()
    hist = conn.execute('SELECT * FROM search_history ORDER BY timestamp DESC LIMIT 20').fetchall()
    result = [dict(row) for row in hist]
    conn.close()
    return jsonify(result)

if __name__ == '__main__':
    app.run(port=5000, debug=True)
