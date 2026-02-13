
import { motion } from 'framer-motion';
import { X, Star, Calendar, Clock, Film } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getMovieProviders } from '../lib/api';

const MovieDetailModal = ({ movie, onClose }) => {
    const [providers, setProviders] = useState(null);
    const [loadingProviders, setLoadingProviders] = useState(false);

    useEffect(() => {
        const fetchProviders = async () => {
            setLoadingProviders(true);
            try {
                const data = await getMovieProviders(movie.id);
                setProviders(data);
            } catch (error) {
                console.error("Failed to fetch providers", error);
            } finally {
                setLoadingProviders(false);
            }
        };

        if (movie.id) {
            fetchProviders();
        }
    }, [movie.id]);

    if (!movie) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-surface w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Full Background Poster */}
                <div className="absolute inset-0 opacity-20 dark:opacity-10">
                    <img
                        src={movie.poster_path?.startsWith('http') ? movie.poster_path : movie.poster_path ? `https://image.tmdb.org/t/p/original${movie.poster_path}` : 'https://via.placeholder.com/800x400?text=No+Image'}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                    />
                </div>

                <button
                    onClick={onClose}
                    className="sticky top-4 right-4 float-right z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors mb-[-40px]"
                >
                    <X size={24} />
                </button>

                {/* Content with backdrop */}
                <div className="relative">
                    {/* Hero Section with Poster Thumbnail */}
                    <div className="relative p-6 md:p-10 flex flex-col md:flex-row gap-6 border-b border-white/5">
                        {/* Poster Thumbnail */}
                        <div className="flex-shrink-0">
                            <img
                                src={movie.poster_path?.startsWith('http') ? movie.poster_path : movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image'}
                                alt={movie.title}
                                className="w-48 md:w-56 rounded-xl shadow-2xl border border-white/10"
                            />
                        </div>

                        {/* Title & Metadata */}
                        <div className="flex-1 flex flex-col justify-end">
                            <h2 className="text-3xl md:text-5xl font-bold text-text dark:text-white mb-4">{movie.title}</h2>
                            <div className="flex flex-wrap items-center gap-4 text-sm md:text-base text-text dark:text-white">
                                {movie.release_date && (
                                    <div className="flex items-center gap-1">
                                        <Calendar size={16} className="text-primary" />
                                        <span>{new Date(movie.release_date).getFullYear()}</span>
                                    </div>
                                )}
                                {movie.vote_average > 0 && (
                                    <div className="flex items-center gap-1">
                                        <Star size={16} className="text-yellow-500 fill-yellow-500" />
                                        <span>{movie.vote_average.toFixed(1)}</span>
                                    </div>
                                )}
                                {movie.original_language && (
                                    <div className="uppercase px-2 py-0.5 bg-white/10 rounded text-xs">
                                        {movie.original_language}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6 md:p-10 space-y-8">
                        {movie.ai_reason && (
                            <div className="bg-primary/10 border border-primary/20 rounded-xl p-6">
                                <h3 className="text-primary font-semibold mb-2 flex items-center gap-2">
                                    <Film size={20} />
                                    Why this matches your mood
                                </h3>
                                <p className="text-text dark:text-gray-200 italic leading-relaxed">"{movie.ai_reason}"</p>
                            </div>
                        )}

                        <div>
                            <h3 className="text-xl font-bold text-text dark:text-white mb-3">Overview</h3>
                            <p className="text-text dark:text-gray-300 leading-relaxed text-lg">{movie.overview || "No overview available."}</p>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-text dark:text-white mb-4">Where to Watch</h3>
                            {loadingProviders ? (
                                <div className="flex gap-2">
                                    <div className="w-12 h-12 bg-white/5 rounded-lg animate-pulse" />
                                    <div className="w-12 h-12 bg-white/5 rounded-lg animate-pulse" />
                                    <div className="w-12 h-12 bg-white/5 rounded-lg animate-pulse" />
                                </div>
                            ) : providers && (providers.flatrate || providers.rent || providers.buy) ? (
                                <div className="space-y-4">
                                    {providers.flatrate && (
                                        <div className="flex flex-col gap-2">
                                            <span className="text-sm text-text/70 dark:text-gray-400">Stream</span>
                                            <div className="flex flex-wrap gap-3">
                                                {providers.flatrate.map(provider => (
                                                    <img
                                                        key={provider.provider_id}
                                                        src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                                                        alt={provider.provider_name}
                                                        title={provider.provider_name}
                                                        className="w-12 h-12 rounded-lg"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {providers.rent && (
                                        <div className="flex flex-col gap-2">
                                            <span className="text-sm text-text/70 dark:text-gray-400">Rent</span>
                                            <div className="flex flex-wrap gap-3">
                                                {providers.rent.map(provider => (
                                                    <img
                                                        key={provider.provider_id}
                                                        src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                                                        alt={provider.provider_name}
                                                        title={provider.provider_name}
                                                        className="w-12 h-12 rounded-lg"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-text/70 dark:text-gray-400">No streaming information available.</p>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default MovieDetailModal;
