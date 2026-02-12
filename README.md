# MovieGuru 🎬

MovieGuru is an intelligent movie recommendation platform that uses Gemini AI to understand your mood and suggest the perfect films from TMDB.

## Features
- **AI-Powered Recommendations**: Type your mood (e.g., "dark sci-fi with a twist"), and get tailored suggestions.
- **Cinematic Dark UI**: A premium, responsive interface built with React and Tailwind CSS.
- **Favorites & History**: Save movies to your watchlist and track your search history.

## Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Axios.
- **Backend**: Python (Flask), SQLite, Gemini API, TMDB API.

## Setup Instructions

### Prerequisites
- Node.js installed (for frontend).
- Python 3 installed (for backend).
- API Keys for Google Gemini and TMDB.

### 1. Backend Setup (Python)
```bash
cd backend
python -m venv venv
# Activate venv
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

pip install flask flask-cors python-dotenv google-generativeai requests

# Create .env file with your keys
# GEMINI_API_KEY=...
# TMDB_API_KEY=...

python app.py
```
The server will start on `http://localhost:5000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The client will start on `http://localhost:5173`.

### 3. Enjoy!
Open your browser and navigate to the frontend URL.
