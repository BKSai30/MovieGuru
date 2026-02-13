import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Calendar, ExternalLink } from 'lucide-react';
import { getMovieProviders } from '../lib/api';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const LOGO_BASE_URL = 'https://image.tmdb.org/t/p/w92';

const MovieDetailModal = ({ movie, onClose }) => {
    const [providers, setProviders] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProviders = async () => {
            try {
                const data = await getMovieProviders(movie.id);
                setProviders(data);
            } catch (error) {
                console.error("Failed to fetch providers", error);
            } finally {
                setLoading(false);
            }
        };

        if (movie?.id) {
            fetchProviders();
        }
    }, [movie]);

    if (!movie) return null;

    const imageUrl = movie.poster_path?.startsWith('http')
        ? movie.poster_path
        : movie.poster_path
            ? `${IMAGE_BASE_URL}${movie.poster_path}`
            : 'https://via.placeholder.com/500x750?text=No+Image';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-surface border border-white/10 rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col md:flex-row"
            >
                {/* Image Section */}
                <div className="w-full md:w-1/3 relative">
                    <div className="aspect-[2/3] w-full h-full relative">
                        <img
                            src={imageUrl}
                            alt={movie.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent md:bg-gradient-to-r" />
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 p-6 md:p-8 flex flex-col gap-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl font-black text-white mb-2">{movie.title}</h2>
                            <div className="flex items-center gap-4 text-gray-400 text-sm">
                                <div className="flex items-center gap-1 text-yellow-400">
                                    <Star size={16} fill="currentColor" />
                                    <span className="font-bold">{movie.vote_average?.toFixed(1)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar size={16} />
                                    <span>{movie.release_date?.split('-')[0]}</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {movie.ai_reason && (
                        <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl">
                            <h4 className="font-bold text-primary text-sm mb-1 flex items-center gap-2">
                                ✨ AI Analysis
                            </h4>
                            <p className="text-gray-300 text-sm leading-relaxed">
                                {movie.ai_reason}
                            </p>
                        </div>
                    )}

                    <div>
                        <h3 className="text-lg font-bold text-white mb-2">Plot</h3>
                        <p className="text-gray-400 leading-relaxed">
                            {movie.overview || "No plot available."}
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-white mb-4">Where to Watch</h3>
                        {loading ? (
                            <div className="animate-pulse flex gap-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-12 h-12 bg-white/10 rounded-lg" />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {!providers || (!providers.flatrate && !providers.rent && !providers.buy) ? (
                                    <p className="text-gray-500 text-sm">No streaming information available.</p>
                                ) : (
                                    <>
                                        {providers.flatrate && (
                                            <div>
                                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Stream</span>
                                                <div className="flex flex-wrap gap-3">
                                                    {providers.flatrate.map(p => (
                                                        <div key={p.provider_id} className="group relative" title={p.provider_name}>
                                                            <img
                                                                src={`${LOGO_BASE_URL}${p.logo_path}`}
                                                                alt={p.provider_name}
                                                                className="w-12 h-12 rounded-lg object-cover shadow-sm ring-1 ring-white/10"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {providers.rent && (
                                            <div>
                                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Rent</span>
                                                <div className="flex flex-wrap gap-3">
                                                    {providers.rent.map(p => (
                                                        <div key={p.provider_id} className="group relative" title={p.provider_name}>
                                                            <img
                                                                src={`${LOGO_BASE_URL}${p.logo_path}`}
                                                                alt={p.provider_name}
                                                                className="w-12 h-12 rounded-lg object-cover shadow-sm ring-1 ring-white/10"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {providers?.link && (
                                    <a
                                        href={providers.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-primary hover:text-primary-hover text-sm mt-2"
                                    >
                                        View all options on TMDB <ExternalLink size={14} />
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default MovieDetailModal;
