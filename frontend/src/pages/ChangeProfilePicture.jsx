import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

// 40 preset profile icons - movies, animals, and fun emojis
const PROFILE_ICONS = [
    '👤', '🎬', '🍿', '🎭', '🎥', '📽️', '🎪', '🌟', '🎯', '🎨',
    '🐶', '🐱', '🐼', '🐨', '🦊', '🦁', '🐯', '🐻', '🐰', '🐸',
    '🦄', '🐉', '🦋', '🐝', '🐢', '🦖', '🦕', '🐙', '🦀', '🐠',
    '🎮', '🎸', '🎹', '🎺', '🎻', '⚽', '🏀', '🎾', '🏈', '⚾'
];

const ChangeProfilePicture = () => {
    const navigate = useNavigate();
    const { currentUser, updateProfileIcon } = useAuth();
    const [selectedIcon, setSelectedIcon] = useState(currentUser?.profileIcon || '👤');

    const handleSave = async () => {
        try {
            await updateProfileIcon(selectedIcon);
            // Dispatch custom event to notify ProfileMenu to update immediately
            window.dispatchEvent(new Event('profileIconChanged'));
            // Dispatch event to refresh posts if on Reviews page
            window.dispatchEvent(new Event('postsNeedRefresh'));
            navigate(-1); // Go back to previous page
        } catch (error) {
            console.error('Error updating profile icon:', error);
        }
    };

    return (
        <div className="min-h-screen bg-background pt-20 pb-16 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-text/70 dark:text-gray-400 hover:text-text dark:hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft size={20} />
                        <span>Back</span>
                    </button>
                    <h1 className="text-4xl font-bold text-text dark:text-white mb-2">Choose Your Profile Picture</h1>
                    <p className="text-text/70 dark:text-gray-400">Select an icon that represents you</p>
                </div>

                {/* Selected Preview */}
                <motion.div
                    className="bg-surface rounded-2xl p-8 mb-8 flex items-center justify-between border border-white/10"
                    layout
                >
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-4xl">
                            {selectedIcon}
                        </div>
                        <div>
                            <p className="text-sm text-text/60 dark:text-gray-400">Currently Selected</p>
                            <p className="text-lg font-semibold text-text dark:text-white">Your Profile Icon</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                        <Check size={20} />
                        Save
                    </button>
                </motion.div>

                {/* Icon Grid */}
                <div className="bg-surface rounded-2xl p-6 border border-white/10">
                    <h2 className="text-xl font-bold text-text dark:text-white mb-6">Select an Icon</h2>
                    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                        {PROFILE_ICONS.map((icon) => (
                            <motion.button
                                key={icon}
                                onClick={() => setSelectedIcon(icon)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className={`aspect-square rounded-xl flex items-center justify-center text-3xl sm:text-4xl transition-all ${selectedIcon === icon
                                    ? 'bg-primary/30 border-2 border-primary shadow-lg'
                                    : 'bg-background hover:bg-primary/10 border border-white/10'
                                    }`}
                            >
                                {icon}
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Bottom Save Button for mobile */}
                <div className="mt-8 sm:hidden">
                    <button
                        onClick={handleSave}
                        className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/80 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                        <Check size={20} />
                        Save Profile Picture
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChangeProfilePicture;
