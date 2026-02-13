import { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';

const SearchBar = ({ onSearch, isLoading }) => {
    const [mood, setMood] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (mood.trim()) onSearch(mood);
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-600 to-primary rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-gradient-x"></div>
            <div className="relative flex items-center bg-surface border border-white/10 rounded-xl p-2 shadow-2xl">
                <div className="p-3 text-text/60 dark:text-gray-400">
                    <Sparkles size={20} className={isLoading ? 'animate-pulse text-primary' : ''} />
                </div>
                <input
                    type="text"
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    placeholder="How are you feeling? (e.g., 'In need of a good laugh' or 'Dark sci-fi vibes')"
                    className="flex-1 bg-transparent border-none text-text dark:text-white placeholder-text/50 dark:placeholder-gray-500 focus:outline-none text-lg px-2"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !mood.trim()}
                    className="bg-primary hover:bg-red-600 text-white p-3 rounded-lg transition-all disabled:opacity-50 disabled:hover:bg-primary"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Search size={20} />
                    )}
                </button>
            </div>
        </form>
    );
};

export default SearchBar;
