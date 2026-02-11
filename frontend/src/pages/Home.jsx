import { useState } from 'react';
import { getRecommendations, toggleFavorite, getFavorites } from '../lib/api';
import SearchBar from '../components/SearchBar';
import MovieCard from '../components/MovieCard';
import { useEffect } from 'react';

const Home = () => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [favorites, setFavorites] = useState(new Set());

    // Fetch favs initially to show correct state
    useEffect(() => {
        getFavorites().then(favs => {
            setFavorites(new Set(favs.map(f => f.tmdb_id)));
        });
    }, []);

    const handleSearch = async (mood) => {
        setLoading(true);
        setError(null);
        try {
            const data = await getRecommendations(mood);
            console.log('API Response:', data); // Debug log
            const results = data.movies || [];
            if (results.length === 0) setError("No movies found for that mood. Try something else!");
            setMovies(results);
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
                <h1 className="text-5xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500">
                    Discover Your Next <span className="text-primary">Masterpiece</span>
                </h1>
                <p className="text-gray-400 text-lg mb-8">
                    Tell us how you're feeling, and we'll curate the perfect cinematic experience for you using AI.
                </p>
                <SearchBar onSearch={handleSearch} isLoading={loading} />
            </div>

            {error && (
                <div className="text-red-400 bg-red-400/10 px-6 py-3 rounded-lg border border-red-400/20 mb-8">
                    {error}
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
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
