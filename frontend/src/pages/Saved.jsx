import { useState, useEffect } from 'react';
import { getFavorites, getHistory, toggleFavorite, deleteHistory } from '../lib/api';
import MovieCard from '../components/MovieCard';
import MovieDetailModal from '../components/MovieDetailModal';
import { Clock, Heart, Trash2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

const Saved = () => {
    const [activeTab, setActiveTab] = useState('favorites');
    const [favorites, setFavorites] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMovie, setSelectedMovie] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [favs, hist] = await Promise.all([getFavorites(), getHistory()]);
            setFavorites(favs);
            setHistory(hist);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (movie) => {
        // Optimistic UI update
        setFavorites(prev => prev.filter(f => f.tmdb_id !== movie.tmdb_id));
        await toggleFavorite(movie);
    };

    const handleClearHistory = () => {
        if (window.confirm('Are you sure you want to clear all search history?')) {
            setHistory([]);
            // You can also call an API here to clear from backend if needed
        }
    };

    const handleDeleteHistoryItem = async (itemId) => {
        setHistory(prev => prev.filter(item => item.id !== itemId));
        try {
            await deleteHistory(itemId);
        } catch (error) {
            console.error(error);
            // Optionally revert optimistic update here
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-primary">Loading...</div>;

    return (
        <div className="min-h-screen pt-24 px-4 max-w-7xl mx-auto">
            <div className="flex gap-4 mb-8 border-b border-white/10 pb-4 items-center justify-between">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('favorites')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${activeTab === 'favorites'
                            ? 'bg-primary text-white shadow-lg shadow-primary/25'
                            : 'text-text/70 hover:text-text dark:text-gray-400 dark:hover:text-white'
                            }`}
                    >
                        <Heart size={18} /> Favorites
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${activeTab === 'history'
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                            : 'text-text/70 hover:text-text dark:text-gray-400 dark:hover:text-white'
                            }`}
                    >
                        <Clock size={18} /> History
                    </button>
                </div>

                {activeTab === 'history' && history.length > 0 && (
                    <button
                        onClick={handleClearHistory}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30 transition-all"
                    >
                        <Trash2 size={16} /> Clear History
                    </button>
                )}
            </div>

            {activeTab === 'favorites' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {favorites.length === 0 ? (
                        <div className="col-span-full text-center py-20 text-text/60 dark:text-gray-500">
                            No favorites yet. Go discover some movies!
                        </div>
                    ) : (
                        favorites.map((movie) => (
                            <MovieCard
                                key={movie.tmdb_id}
                                movie={movie}
                                isFavorite={true}
                                onToggleFavorite={() => handleToggle(movie)}
                                onClick={() => setSelectedMovie(movie)}
                            />
                        ))
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {history.length === 0 ? (
                        <div className="text-center py-20 text-text/60 dark:text-gray-500">
                            No search history yet.
                        </div>
                    ) : (
                        history.map((item) => (
                            <div key={item.id} className="bg-surface p-4 rounded-xl flex justify-between items-center border border-white/5 hover:border-white/10 transition group">
                                <div>
                                    <h4 className="font-bold text-lg text-text dark:text-white">"{item.mood}"</h4>
                                    <p className="text-xs text-text/50 dark:text-gray-500">{new Date(item.timestamp).toLocaleString()}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="bg-white/5 px-3 py-1 rounded-full text-xs text-text/70 dark:text-gray-300">
                                        {item.result_count} results
                                    </span>
                                    <button
                                        onClick={() => handleDeleteHistoryItem(item.id)}
                                        className="p-2 rounded-lg text-text/50 hover:text-red-500 hover:bg-red-500/10 dark:text-gray-500 dark:hover:text-red-500 transition-all"
                                        title="Delete this search"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
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

export default Saved;
