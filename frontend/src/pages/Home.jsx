import { useState } from 'react';
import { getRecommendations, toggleFavorite, getFavorites } from '../lib/api';
import SearchBar from '../components/SearchBar';
import MovieCard from '../components/MovieCard';
import MovieDetailModal from '../components/MovieDetailModal';
import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';

const Home = () => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [favorites, setFavorites] = useState(new Set());
    const [explanation, setExplanation] = useState('');
    const [selectedMovie, setSelectedMovie] = useState(null);

    // Fetch favs initially to show correct state
    useEffect(() => {
        getFavorites().then(favs => {
            setFavorites(new Set(favs.map(f => f.tmdb_id)));
        });
    }, []);

    const handleSearch = async (mood) => {
        setLoading(true);
        setError(null);
        setExplanation('');
        try {
            const data = await getRecommendations(mood);
            console.log('API Response:', data); // Debug log
            const results = data.movies || [];
            if (results.length === 0) setError("No movies found for that mood. Try something else!");
            setMovies(results);
            setExplanation(data.explanation || '');
        } catch (err) {
            console.error(err);
            setError("Failed to fetch recommendations. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (movie) => {
        const isFav = favorites.has(movie.id);
        // Optimistic update
        const newFavs = new Set(favorites);
        if (isFav) newFavs.delete(movie.id);
        else newFavs.add(movie.id);
        setFavorites(newFavs);

        try {
            await toggleFavorite(movie);
        } catch (err) {
            // Revert if failed
            setFavorites(favorites);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 max-w-7xl mx-auto flex flex-col items-center">
            <div className="text-center mb-12 max-w-2xl">
                <h1 className="text-5xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-700 via-gray-900 to-black dark:from-white dark:via-gray-200 dark:to-gray-500">
                    Discover Your Next <span className="text-primary">Masterpiece</span>
                </h1>
                <p className="text-text/80 dark:text-gray-400 text-lg mb-8">
                    Tell us how you're feeling, and we'll curate the perfect cinematic experience for you using AI.
                </p>
                <SearchBar onSearch={handleSearch} isLoading={loading} />
            </div>

            {error && (
                <div className="text-red-400 bg-red-400/10 px-6 py-3 rounded-lg border border-red-400/20 mb-8">
                    {error}
                </div>
            )}

            {explanation && !loading && !error && (
                <div className="max-w-3xl mx-auto mb-10 p-6 bg-surface/50 border border-white/5 rounded-xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex gap-4 items-start">
                        <div className="p-2 bg-primary/20 rounded-lg text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-1 text-white">AI Suggestion</h3>
                            <p className="text-text dark:text-gray-300 leading-relaxed">{explanation}</p>
                        </div>
                    </div>
                </div>
            )}

            {movies.length > 0 && (
                <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <span className="w-1 h-8 bg-primary rounded-full"></span>
                        Recommended for you
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {movies.map((movie) => (
                            <MovieCard
                                key={movie.id}
                                movie={movie}
                                isFavorite={favorites.has(movie.id)}
                                onToggleFavorite={handleToggle}
                                onClick={setSelectedMovie}
                            />
                        ))}
                    </div>
                </div>
            )}

            <AnimatePresence>
                {selectedMovie && (
                    <MovieDetailModal
                        movie={selectedMovie}
                        onClose={() => setSelectedMovie(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Home;
