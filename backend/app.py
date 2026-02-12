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
TMDB_API_KEY = os.getenv("TMDB_API_KEY") # Keep for fallback
OMDB_API_KEY = os.getenv("OMDB_API_KEY")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
TMDB_DISCOVER_URL = "https://api.themoviedb.org/3/discover/movie"
OMDB_URL = "http://www.omdbapi.com/"

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

    try:
        genre_ids = []
        movies = []
        
        # 1. Try OMDb Strategy (Gemini -> Titles -> OMDb)
        if OMDB_API_KEY and len(OMDB_API_KEY) >= 8: # Basic validation
            try:
                # Ask Gemini for Titles
                prompt = f"""Suggest 5 specific movie titles that match the mood '{mood}'. 
                Return ONLY a JSON array of strings (e.g., ["Movie 1", "Movie 2"]). 
                Do not include generic descriptions or markdown formatting."""
                
                payload = {"contents": [{"parts": [{"text": prompt}]}]}
                headers = {"Content-Type": "application/json"}
                response = requests.post(GEMINI_URL, json=payload, headers=headers)
                response.raise_for_status()
                
                gemini_data = response.json()
                text = gemini_data['candidates'][0]['content']['parts'][0]['text']
                clean_text = text.replace('```json', '').replace('```', '').strip()
                suggested_titles = json.loads(clean_text)
                
                # Fetch details from OMDb
                for title in suggested_titles:
                    omdb_params = {'apikey': OMDB_API_KEY, 't': title}
                    omdb_res = requests.get(OMDB_URL, params=omdb_params)
                    if omdb_res.status_code == 200:
                        data = omdb_res.json()
                        if data.get('Response') == 'True':
                            # Parse ID
                            imdb_id = data.get('imdbID', '0')
                            # Try to convert tt12345 to integer 12345 for DB compatibility
                            try:
                                db_id = int(imdb_id.replace('tt', ''))
                            except:
                                db_id = hash(imdb_id) % 100000000 # Fallback hash
                                
                            movies.append({
                                'id': db_id,
                                'title': data.get('Title'),
                                'poster_path': data.get('Poster'), # Full URL
                                'release_date': data.get('Released', data.get('Year')),
                                'overview': data.get('Plot'),
                                'vote_average': float(data.get('imdbRating', 0) if data.get('imdbRating') != 'N/A' else 0),
                                'imdb_id': imdb_id
                            })
            except Exception as e:
                print(f"OMDb/Gemini Error: {e}")
                
                # Fallback: Direct OMDb Search using mood as keyword
                print(f"Attempting direct OMDb search for: {mood}")
                try:
                    omdb_params = {'apikey': OMDB_API_KEY, 's': mood, 'type': 'movie'}
                    omdb_res = requests.get(OMDB_URL, params=omdb_params)
                    if omdb_res.status_code == 200:
                        search_data = omdb_res.json()
                        if search_data.get('Response') == 'True':
                            for item in search_data.get('Search', [])[:5]: # Limit to 5
                                # Fetch full details to get Plot and Rating
                                details_res = requests.get(OMDB_URL, params={'apikey': OMDB_API_KEY, 'i': item['imdbID']})
                                if details_res.status_code == 200:
                                    data = details_res.json()
                                    
                                    # Parse ID
                                    imdb_id = data.get('imdbID', '0')
                                    try:
                                        db_id = int(imdb_id.replace('tt', ''))
                                    except:
                                        db_id = hash(imdb_id) % 100000000 
                                        
                                    movies.append({
                                        'id': db_id,
                                        'title': data.get('Title'),
                                        'poster_path': data.get('Poster'), 
                                        'release_date': data.get('Released', data.get('Year')),
                                        'overview': data.get('Plot'),
                                        'vote_average': float(data.get('imdbRating', 0) if data.get('imdbRating') != 'N/A' else 0),
                                        'imdb_id': imdb_id
                                    })
                except Exception as fallback_e:
                    print(f"OMDb Fallback Error: {fallback_e}")

        # 2. Key-based Fallback to TMDB (if OMDb failed or no key)
        if not movies and TMDB_API_KEY and "YOUR_TMDB_API_KEY" not in TMDB_API_KEY:
            try:
                # Ask Gemini for Genres
                prompt = f"""Map this mood '{mood}' to relevant TMDB genre IDs. 
                Available IDs: Action=28, Adventure=12, Animation=16, Comedy=35, Crime=80, 
                Documentary=99, Drama=18, Family=10751, Fantasy=14, History=36, Horror=27, 
                Music=10402, Mystery=9648, Romance=10749, Sci-Fi=878, TV Movie=10770, 
                Thriller=53, War=10752, Western=37. 
                Return ONLY a JSON array of integers (e.g., [28, 12]). Do not format as markdown."""

                payload = {"contents": [{"parts": [{"text": prompt}]}]}
                headers = {"Content-Type": "application/json"}
                response = requests.post(GEMINI_URL, json=payload, headers=headers)
                response.raise_for_status()
                
                gemini_data = response.json()
                text = gemini_data['candidates'][0]['content']['parts'][0]['text']
                clean_text = text.replace('```json', '').replace('```', '').strip()
                genre_ids = json.loads(clean_text)
                
                # Discover Movies from TMDB
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
            except Exception as e:
                print(f"TMDB API Error: {e}")
        
        # 3. Last Result Fallback (Mock)
        if not movies:
            print("Using mock movies due to missing/invalid keys or API error")
            movies = get_mock_movies()

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
