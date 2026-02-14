
import os
import json
import datetime
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

app = Flask(__name__)
CORS(app)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
TMDB_API_KEY = os.getenv("TMDB_API_KEY") 
OMDB_API_KEY = os.getenv("OMDB_API_KEY")

# Sanitize keys
if OPENROUTER_API_KEY: OPENROUTER_API_KEY = OPENROUTER_API_KEY.strip().replace('"', '').replace("'", "")
if OMDB_API_KEY: OMDB_API_KEY = OMDB_API_KEY.strip().replace('"', '').replace("'", "")
if TMDB_API_KEY: TMDB_API_KEY = TMDB_API_KEY.strip().replace('"', '').replace("'", "")

print(f"DEBUG: Loaded OpenRouter Key: {OPENROUTER_API_KEY[:5]}...{OPENROUTER_API_KEY[-5:] if OPENROUTER_API_KEY else 'None'}")

TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"
OMDB_URL = "http://www.omdbapi.com/"

# --- Local DB Implementation ---
class LocalDocument:
    def __init__(self, data, doc_id, wrapper):
        self._data = data
        self.id = doc_id
        self.exists = data is not None
        self._wrapper = wrapper

    def to_dict(self):
        return self._data if self._data else {}
    
    @property
    def reference(self):
        return self

    def get(self):
        return self

    def set(self, data):
        self._wrapper.set_doc(self.id, data)

    def update(self, data):
        if not self.exists: return
        current = self._data.copy()
        
        # Handle simple updates and ArrayUnion
        for k, v in data.items():
            if isinstance(v, list) and hasattr(v, 'is_array_union'):
                if k not in current: current[k] = []
                current[k].extend(v)
            else:
                current[k] = v
        self._wrapper.set_doc(self.id, current)

    def delete(self):
        self._wrapper.delete_doc(self.id)

class LocalCollection:
    def __init__(self, name):
        self.name = name
        self.file_path = os.path.join(os.path.dirname(__file__), f'{name}.json')
        self._load()

    def _load(self):
        if not os.path.exists(self.file_path):
            if self.name in ['posts', 'search_history']: self.data = []  # Lists
            else: self.data = {} # Users as dict
            self._save()
        else:
            with open(self.file_path, 'r') as f:
                try:
                    self.data = json.load(f)
                except:
                    self.data = [] if self.name in ['posts', 'search_history'] else {}

    def _save(self):
        with open(self.file_path, 'w') as f:
            json.dump(self.data, f, indent=4, default=str)

    def document(self, doc_id):
        if isinstance(self.data, dict):
            # Dict based collection (users)
            return LocalDocument(self.data.get(doc_id), doc_id, self)
        else:
            # List based collection (posts, history)
            # Find item by 'id' field
            item = next((x for x in self.data if str(x.get('id', '')) == str(doc_id)), None)
            return LocalDocument(item, doc_id, self)

    def set_doc(self, doc_id, data):
        if isinstance(self.data, dict):
            self.data[doc_id] = data
        else:
            # Create new or replace
            existing = next((i for i, x in enumerate(self.data) if str(x.get('id', '')) == str(doc_id)), None)
            data['id'] = doc_id
            if existing is not None:
                self.data[existing] = data
            else:
                self.data.append(data)
        self._save()

    def delete_doc(self, doc_id):
        if isinstance(self.data, dict):
            if doc_id in self.data:
                del self.data[doc_id]
        else:
            self.data = [x for x in self.data if str(x.get('id', '')) != str(doc_id)]
        self._save()

    def add(self, data):
        import uuid
        doc_id = str(uuid.uuid4())
        data['id'] = doc_id
        if isinstance(self.data, list):
            self.data.append(data)
            self._save()
            return datetime.datetime.now(), self.document(doc_id)
        return None, None

    # Query methods
    def where(self, field, op, value):
        # Return a filtered View of collection
        return QueryView(self.data, self.name).where(field, op, value)

    def order_by(self, field, direction='desc'):
        return QueryView(self.data, self.name).order_by(field, direction)
        
    def stream(self):
        return QueryView(self.data, self.name).stream()

class QueryView:
    def __init__(self, data, name):
        self.data = data # List or Dict
        self.name = name # collection name
        
    def where(self, field, op, value):
        # Only support == for now as per app usage
        if isinstance(self.data, dict):
            filtered = {k:v for k,v in self.data.items() if v.get(field) == value}
            return QueryView(filtered, self.name)
        else:
            filtered = [x for x in self.data if x.get(field) == value]
            return QueryView(filtered, self.name)

    def order_by(self, field, direction='desc'):
        # Only lists can be ordered
        if isinstance(self.data, list):
            reverse = True # Default desc
            sorted_data = sorted(self.data, key=lambda x: x.get(field, ''), reverse=reverse)
            return QueryView(sorted_data, self.name)
        return self

    def limit(self, limit):
        if isinstance(self.data, list):
            return QueryView(self.data[:limit], self.name)
        return self

    def stream(self):
        # Yield LocalDocuments
        if isinstance(self.data, dict):
            for k, v in self.data.items():
                yield LocalDocument(v, k, None) # Wrapper None for read-only stream mostly
        else:
            for item in self.data:
                yield LocalDocument(item, item.get('id'), LocalCollection(self.name))

class LocalDB:
    def collection(self, name):
        return LocalCollection(name)

# Mock Firestore helpers
class MockFirestore:
    def client(self): return LocalDB()
    class Query:
        DESCENDING = 'desc'
    class ArrayUnion(list):
        def __init__(self, iterable):
            super().__init__(iterable)
            self.is_array_union = True
    SERVER_TIMESTAMP = datetime.datetime.now().isoformat()

firestore = MockFirestore()
db = LocalDB() 
print("DEBUG: Using Local JSON Database")


# --- Helper Functions ---
def get_user_ref(email):
    return db.collection('users').document(email)

def get_post_ref(post_id):
    return db.collection('posts').document(post_id)

# --- Routes ---

@app.route('/api/signup', methods=['POST'])
def signup():
    # if not db: return jsonify({'error': 'Database unavailable'}), 500
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400
        
    user_ref = get_user_ref(email)
    if user_ref.get().exists:
        return jsonify({'error': 'User already exists'}), 400
        
    user_data = {
        'password': password, 
        'favorites': [],
        'profileIcon': '👤',
        'createdAt': datetime.datetime.now().isoformat()
    }
    user_ref.set(user_data)
    
    return jsonify({'email': email, 'favorites': [], 'profileIcon': '👤'})

@app.route('/api/login', methods=['POST'])
def login():
    # if not db: return jsonify({'error': 'Database unavailable'}), 500
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    user_ref = get_user_ref(email)
    doc = user_ref.get()
    
    if not doc.exists:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    user_data = doc.to_dict()
    if user_data.get('password') != password:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Ensure profileIcon exists
    if 'profileIcon' not in user_data:
        user_data['profileIcon'] = '👤'
        user_ref.update({'profileIcon': '👤'})
    
    return jsonify({
        'email': email, 
        'favorites': user_data.get('favorites', []),
        'profileIcon': user_data.get('profileIcon', '👤')
    })

@app.route('/api/profile/icon', methods=['PUT'])
def update_profile_icon():
    # if not db: return jsonify({'error': 'Database unavailable'}), 500
    data = request.json
    email = data.get('email')
    profile_icon = data.get('profileIcon')
    
    if not email or not profile_icon:
        return jsonify({'error': 'Email and profileIcon required'}), 400
    
    user_ref = get_user_ref(email)
    if not user_ref.get().exists:
        return jsonify({'error': 'User not found'}), 404
    
    # Update user's profile icon
    user_ref.update({'profileIcon': profile_icon})
    
    # Update icons in posts 
    posts_ref = db.collection('posts')
    query = posts_ref.where('author', '==', email).stream()
    for post in query:
        if not post.to_dict().get('anonymous', False):
             post.update({'profileIcon': profile_icon})
             
    # Update comments
    all_posts = posts_ref.stream()
    updated = False
    for post_doc in all_posts:
        p_data = post_doc.to_dict()
        p_comments = p_data.get('comments', [])
        comments_changed = False
        for comment in p_comments:
            if comment.get('author') == email:
                comment['profileIcon'] = profile_icon
                comments_changed = True
        
        if comments_changed:
            post_doc.update({'comments': p_comments})
            updated = True

    return jsonify({'profileIcon': profile_icon, 'postsUpdated': updated})

def get_mock_movies():
    return [
        {"id": 27205, "title": "Inception", "vote_average": 8.4, "poster_path": "/8Z8dptZQl1qWhIdHgtiKTfIv1HQ.jpg", "release_date": "2010-07-15", "overview": "Dream within a dream."},
        {"id": 157336, "title": "Interstellar", "vote_average": 8.4, "poster_path": "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", "release_date": "2014-11-05", "overview": "Space travel."},
        {"id": 155, "title": "The Dark Knight", "vote_average": 8.5, "poster_path": "/qJ2tW6WMUDux911r6m7haRef0WH.jpg", "release_date": "2008-07-14", "overview": "Batman vs Joker."}
    ]

@app.route('/api/recommend', methods=['POST'])
def recommend():
    # if not db: return jsonify({'error': 'Database unavailable'}), 500
    data = request.json
    mood = data.get('mood')
    email = data.get('email')
    
    if not mood:
        return jsonify({'error': 'Mood is required'}), 400

    movies = []
    explanation = ""
    use_tmdb = TMDB_API_KEY and len(TMDB_API_KEY) > 20 and "YOUR_TMDB_API_KEY" not in TMDB_API_KEY

    # AI Recommendation Logic
    if OPENROUTER_API_KEY:
        try:
            print("DEBUG: Asking OpenRouter (Grok) for recommendations...")
            prompt = f"""
            Act as a movie expert. The user is feeling: "{mood}".
            Suggest 5 movies that perfectly match this emotional state or theme.
            Return ONLY a raw JSON array of objects: [ {{"title": "Title", "reason": "Reason"}} ]
            """
            
            models_to_try = ["openrouter/free", "google/gemini-2.0-flash-exp:free", "mistralai/mistral-7b-instruct:free"]
            
            for model in models_to_try:
                try:
                    url = "https://openrouter.ai/api/v1/chat/completions"
                    headers = {'Content-Type': 'application/json', 'Authorization': f'Bearer {OPENROUTER_API_KEY}', 'HTTP-Referer': 'http://localhost:5173', 'X-Title': 'MovieGuru'}
                    payload = {"messages": [{"role": "system", "content": "You are a helpful movie expert."}, {"role": "user", "content": prompt}], "model": model, "temperature": 0.7}
                    
                    response = requests.post(url, headers=headers, json=payload)
                    if response.status_code == 200:
                        clean_json = response.json()['choices'][0]['message']['content'].replace('```json', '').replace('```', '').strip()
                        import re
                        match = re.search(r'\[.*\]', clean_json, re.DOTALL)
                        if match:
                            recommendations = json.loads(match.group(0))
                            explanation = f"Here are some picks for your mood: '{mood}'"
                            
                            for rec in recommendations:
                                title = rec.get('title')
                                reason = rec.get('reason')
                                
                                if use_tmdb:
                                    tmdb_res = requests.get(f"{TMDB_BASE_URL}/search/movie", params={'api_key': TMDB_API_KEY, 'query': title})
                                    if tmdb_res.status_code == 200 and tmdb_res.json().get('results'):
                                        m = tmdb_res.json().get('results')[0]
                                        movies.append({'id': m['id'], 'title': m['title'], 'poster_path': m.get('poster_path'), 'overview': m.get('overview'), 'vote_average': m.get('vote_average'), 'ai_reason': reason, 'release_date': m.get('release_date')})
                                elif OMDB_API_KEY:
                                    # OMDb fallback
                                    try:
                                        omdb_res = requests.get(OMDB_URL, params={'apikey': OMDB_API_KEY, 't': title, 'type': 'movie'})
                                        if omdb_res.status_code == 200:
                                            m = omdb_res.json()
                                            if m.get('Response') == 'True':
                                                poster = m.get('Poster')
                                                if poster == 'N/A': poster = None
                                                try:
                                                    rating = float(m.get('imdbRating', 0))
                                                except:
                                                    rating = 0.0
                                                movies.append({
                                                    'id': m.get('imdbID'),
                                                    'title': m.get('Title'),
                                                    'poster_path': poster,
                                                    'overview': m.get('Plot'),
                                                    'vote_average': rating, 
                                                    'ai_reason': reason,
                                                    'release_date': m.get('Released')
                                                })
                                    except Exception as e:
                                        print(f"OMDb Error for {title}: {e}")
                            
                            if movies: break
                except Exception as e:
                     print(f"Model {model} failed: {e}")

        except Exception as e:
            print(f"AI Error: {e}")

    # Fallback
    if not movies and use_tmdb:
         try:
            tmdb_res = requests.get(f"{TMDB_BASE_URL}/search/movie", params={'api_key': TMDB_API_KEY, 'query': mood})
            if tmdb_res.status_code == 200:
                for m in tmdb_res.json().get('results', [])[:5]:
                     movies.append({'id': m['id'], 'title': m['title'], 'poster_path': m.get('poster_path'), 'overview': m.get('overview'), 'vote_average': m.get('vote_average')})
         except: pass
         
    if not movies:
        movies = get_mock_movies()
        explanation = "We couldn't connect services, but try these favorites!"

    # SAVE TO HISTORY
    if db:
        try:
            if email:
                db.collection('search_history').add({
                    'mood': mood,
                    'result_count': len(movies),
                    'email': email,
                    'timestamp': firestore.SERVER_TIMESTAMP
                })
        except Exception as e:
            print(f"History Save Error: {e}")

    return jsonify({'mood': mood, 'explanation': explanation, 'movies': movies})

@app.route('/api/favorites', methods=['POST'])
def favorites():
    # if not db: return jsonify({'error': 'Database unavailable'}), 500
    data = request.json
    email = data.get('email')
    
    if not email: return jsonify({'error': 'Email required'}), 400

    user_ref = get_user_ref(email)
    doc = user_ref.get()
    
    if not doc.exists:
         return jsonify({'error': 'User not found'}), 404
    
    user_data = doc.to_dict()
    current_favs = user_data.get('favorites', [])
    
    if data.get('action') == 'get':
         return jsonify(current_favs)

    # Toggle
    movie = data.get('movie')
    if not movie: return jsonify({'error': 'Movie data required'}), 400
    
    # Check if exists (by ID) -- Flexible for int vs str ids
    existing_index = next((index for (index, d) in enumerate(current_favs) if str(d.get("id")) == str(movie.get("id"))), None)
    
    if existing_index is not None:
        current_favs.pop(existing_index)
        status = 'removed'
    else:
        current_favs.append(movie)
        status = 'added'
        
    user_ref.update({'favorites': current_favs})
    return jsonify({'status': status, 'favorites': current_favs})

@app.route('/api/history', methods=['GET'])
def history():
    # if not db: return jsonify({'error': 'Database unavailable'}), 500
    email = request.args.get('email')
    if not email: return jsonify([])
    
    try:
        history_ref = db.collection('search_history')
        query = history_ref.where('email', '==', email).order_by('timestamp', direction=firestore.Query.DESCENDING).limit(20)
        docs = query.stream()
        
        result = []
        for doc in docs:
            d = doc.to_dict()
            # Clean up timestamp for frontend
            if d.get('timestamp'):
                d['timestamp'] = str(d['timestamp'])
            d['id'] = doc.id
            result.append(d)
            
        return jsonify(result)
    except Exception as e:
        print(f"History Error: {e}")
        return jsonify([])

@app.route('/api/history/<history_id>', methods=['DELETE'])
def delete_history(history_id):
    try:
        db.collection('search_history').document(history_id).delete()
        return jsonify({'message': 'Deleted successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- Posts API ---

@app.route('/api/posts', methods=['GET'])
def get_posts():
    # if not db: return jsonify({'error': 'Database unavailable'}), 500
    try:
        posts_ref = db.collection('posts')
        query = posts_ref.order_by('timestamp', direction=firestore.Query.DESCENDING).limit(50)
        docs = query.stream()
        
        posts = []
        for doc in docs:
             p = doc.to_dict()
             p['id'] = doc.id
             posts.append(p)
        return jsonify(posts)
    except Exception as e:
        print(f"Get Posts Error: {e}")
        return jsonify([])

@app.route('/api/posts', methods=['POST'])
def create_post():
    # if not db: return jsonify({'error': 'Database unavailable'}), 500
    data = request.json
    email = data.get('email')
    movie_title = data.get('movieTitle')
    content = data.get('content')
    rating = data.get('rating', 5)
    anonymous = data.get('anonymous', False)
    profile_icon = data.get('profileIcon', '👤')
    
    if not all([email, movie_title, content]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    movie_poster = None
    movie_year = None
    movie_plot = None
    try:
        if OMDB_API_KEY:
            omdb_res = requests.get(OMDB_URL, params={'apikey': OMDB_API_KEY, 't': movie_title, 'type': 'movie'})
            if omdb_res.status_code == 200:
                 md = omdb_res.json()
                 if md.get('Response') == 'True':
                     movie_poster = md.get('Poster') if md.get('Poster') != 'N/A' else None
                     movie_year = md.get('Year')
                     movie_plot = md.get('Plot')
    except: pass
    
    new_post = {
        'author': email,
        'movieTitle': movie_title,
        'content': content,
        'rating': rating,
        'anonymous': anonymous,
        'profileIcon': profile_icon,
        'moviePoster': movie_poster,
        'movieYear': movie_year,
        'moviePlot': movie_plot,
        'timestamp': datetime.datetime.now().isoformat(),
        'comments': []
    }
    
    update_time, doc_ref = db.collection('posts').add(new_post)
    new_post['id'] = doc_ref.id
    
    return jsonify(new_post), 201

@app.route('/api/posts/<post_id>', methods=['PUT'])
def edit_post(post_id):
    # if not db: return jsonify({'error': 'Database unavailable'}), 500
    data = request.json
    email = data.get('email')
    
    doc_ref = db.collection('posts').document(post_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        return jsonify({'error': 'Post not found'}), 404
    
    post = doc.to_dict()
    if post['author'] != email:
        return jsonify({'error': 'Unauthorized'}), 403
    
    updates = {}
    if 'movieTitle' in data: updates['movieTitle'] = data['movieTitle']
    if 'content' in data: updates['content'] = data['content']
    if 'rating' in data: updates['rating'] = data['rating']
    
    if updates:
        doc_ref.update(updates)
        
    return jsonify({**post, **updates})

@app.route('/api/posts/<post_id>', methods=['DELETE'])
def delete_post(post_id):
    # if not db: return jsonify({'error': 'Database unavailable'}), 500
    data = request.json
    email = data.get('email')
    
    doc_ref = db.collection('posts').document(post_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        return jsonify({'error': 'Post not found'}), 404
    
    if doc.to_dict()['author'] != email:
        return jsonify({'error': 'Unauthorized'}), 403
    
    doc_ref.delete()
    return jsonify({'message': 'Post deleted'})

@app.route('/api/posts/<post_id>/comments', methods=['POST'])
def add_comment(post_id):
    # if not db: return jsonify({'error': 'Database unavailable'}), 500
    data = request.json
    email = data.get('email')
    content = data.get('content')
    profile_icon = data.get('profileIcon', '👤')
    
    doc_ref = db.collection('posts').document(post_id)
    doc = doc_ref.get()
    
    if not doc.exists: return jsonify({'error': 'Post not found'}), 404
    
    import uuid
    comment_id = str(uuid.uuid4())
    new_comment = {
        'id': comment_id,
        'author': email,
        'content': content,
        'profileIcon': profile_icon,
        'timestamp': datetime.datetime.now().isoformat()
    }
    
    doc_ref.update({
        'comments': firestore.ArrayUnion([new_comment])
    })
    
    return jsonify(new_comment), 201

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(port=port, debug=True)
