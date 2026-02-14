import { Play, Star, Plus, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const MovieCard = ({ movie, isFavorite, onToggleFavorite, onClick }) => {
    const imageUrl = movie.poster_path?.startsWith('http')
        ? movie.poster_path
        : movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : 'https://via.placeholder.com/500x750?text=No+Image';

    const ratingColor = movie.vote_average >= 7 ? 'text-green-400' : 'text-yellow-400';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            layout
            onClick={() => onClick(movie)}
            className="group relative bg-surface rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
        >
            <div className="aspect-[2/3] w-full relative overflow-hidden">
                <img
                    src={imageUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <p className="text-white text-sm line-clamp-3 mb-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all delay-100">
                        {movie.overview}
                    </p>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(movie);
                        }}
                        className={`w-full py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${isFavorite
                            ? 'bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/30'
                            : 'bg-white text-black hover:bg-primary hover:text-white border-none'
                            }`}
                    >
                        {isFavorite ? <><Check size={16} /> Saved</> : <><Plus size={16} /> Add to Favorites</>}
                    </button>
                </div>
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1 border border-white/10">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className={`text-xs font-bold ${ratingColor}`}>{Number(movie.vote_average || 0).toFixed(1)}</span>
                </div>
            </div>

            <div className="p-4">
                <h3 className="font-bold text-lg leading-tight mb-1 truncate" title={movie.title}>{movie.title}</h3>
                <p className="text-text/60 dark:text-gray-400 text-xs">{movie.release_date?.split('-')[0] || 'Unknown'}</p>
            </div>
        </motion.div>
    );
};

export default MovieCard;
