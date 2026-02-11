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

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
TMDB_API_KEY = os.getenv("TMDB_API_KEY")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
TMDB_DISCOVER_URL = "https://api.themoviedb.org/3/discover/movie"

# Initialize DB
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

        CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tmdb_id INTEGER UNIQUE NOT NULL,
            title TEXT NOT NULL,
            poster_path TEXT,
            release_date TEXT,
            overview TEXT,
            rating REAL
        );
    ''')
    conn.commit()
    conn.close()
    print("Database connected and initialized.")

init_db()

@app.route('/api/recommend', methods=['POST'])
def recommend():
    data = request.json
    mood = data.get('mood')
    if not mood:
        return jsonify({'error': 'Mood is required'}), 400

    try:
        # 1. Get Genres from Gemini
        prompt = f"""Map this mood '{mood}' to relevant TMDB genre IDs. 
        Available IDs: Action=28, Adventure=12, Animation=16, Comedy=35, Crime=80, 
        Documentary=99, Drama=18, Family=10751, Fantasy=14, History=36, Horror=27, 
        Music=10402, Mystery=9648, Romance=10749, Sci-Fi=878, TV Movie=10770, 
        Thriller=53, War=10752, Western=37. 
        Return ONLY a JSON array of integers (e.g., [28, 12]). Do not format as markdown."""

        genre_ids = []
        try:
            payload = {"contents": [{"parts": [{"text": prompt}]}]}
            headers = {"Content-Type": "application/json"}
            response = requests.post(GEMINI_URL, json=payload, headers=headers)
            response.raise_for_status()
            
            gemini_data = response.json()
            text = gemini_data['candidates'][0]['content']['parts'][0]['text']
            clean_text = text.replace('```json', '').replace('```', '').strip()
            genre_ids = json.loads(clean_text)
        except Exception as e:
            print(f"Gemini API Error: {e}")
            # Fallback
            mood_lower = mood.lower()
            if 'funny' in mood_lower: genre_ids.append(35)
            if 'sad' in mood_lower: genre_ids.append(18)
            if 'scary' in mood_lower: genre_ids.append(27)
            if 'action' in mood_lower: genre_ids.append(28)
            if not genre_ids: genre_ids = [18, 35]

        # 2. Discover Movies from TMDB
        tmdb_params = {
            'api_key': TMDB_API_KEY,
            'with_genres': ','.join(map(str, genre_ids)),
            'sort_by': 'popularity.desc',
            'language': 'en-US',
            'page': 1
        }
        tmdb_res = requests.get(TMDB_DISCOVER_URL, params=tmdb_params)
        tmdb_res.raise_for_status()
        movies = tmdb_res.json().get('results', [])

        # 3. Save Search History
        conn = get_db_connection()
        conn.execute('INSERT INTO search_history (mood, result_count) VALUES (?, ?)', (mood, len(movies)))
        conn.commit()
        conn.close()

        return jsonify({'mood': mood, 'genreIds': genre_ids, 'movies': movies})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/favorites', methods=['GET', 'POST'])
def favorites():
    conn = get_db_connection()
    if request.method == 'GET':
        favs = conn.execute('SELECT * FROM favorites ORDER BY id DESC').fetchall()
        # Convert rows to dicts
        result = [dict(row) for row in favs]
        conn.close()
        return jsonify(result)
    
    if request.method == 'POST':
        data = request.json
        movie = data.get('movie')
        try:
            # Check existing
            existing = conn.execute('SELECT id FROM favorites WHERE tmdb_id = ?', (movie['id'],)).fetchone()
            
            if existing:
                conn.execute('DELETE FROM favorites WHERE tmdb_id = ?', (movie['id'],))
                conn.commit()
                conn.close()
                return jsonify({'status': 'removed', 'tmdb_id': movie['id']})
            else:
                conn.execute('''
                    INSERT INTO favorites (tmdb_id, title, poster_path, release_date, overview, rating) 
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (movie['id'], movie['title'], movie['poster_path'], movie['release_date'], movie['overview'], movie['vote_average']))
                conn.commit()
                conn.close()
                return jsonify({'status': 'added', 'tmdb_id': movie['id']})
        except Exception as e:
            conn.close()
            print(e)
            return jsonify({'error': 'DB Error'}), 500

@app.route('/api/history', methods=['GET'])
def history():
    conn = get_db_connection()
    hist = conn.execute('SELECT * FROM search_history ORDER BY timestamp DESC LIMIT 20').fetchall()
    result = [dict(row) for row in hist]
    conn.close()
    return jsonify(result)

if __name__ == '__main__':
    app.run(port=5000, debug=True)
