import { useState, useEffect } from 'react';
import { LogOut, Trash2, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const ProfileMenu = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIcon, setSelectedIcon] = useState(currentUser?.profileIcon || '👤');

    // Sync with currentUser when it changes or when custom event fires
    useEffect(() => {
        const updateIcon = () => {
            if (currentUser?.profileIcon) {
                setSelectedIcon(currentUser.profileIcon);
            }
        };

        // Update when currentUser changes
        updateIcon();

        // Listen for custom event when profile icon is changed
        window.addEventListener('profileIconChanged', updateIcon);

        return () => {
            window.removeEventListener('profileIconChanged', updateIcon);
        };
    }, [currentUser]);

    const handleLogout = () => {
        logout();
        setIsOpen(false);
    };

    const handleDeleteAccount = () => {
        if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            // Call delete account API here
            logout();
        }
    };

    const handleChangeProfilePicture = () => {
        setIsOpen(false);
        navigate('/change-profile-picture');
    };

    if (!currentUser) return null;

    return (
        <div className="relative">
            {/* Profile Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-2 rounded-full bg-surface hover:bg-surface/80 border border-white/10 transition-all"
            >
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-lg">
                    {selectedIcon}
                </div>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Menu */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-0 mt-2 w-64 bg-surface rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden"
                        >
                            {/* User Info */}
                            <div className="p-4 border-b border-white/10 bg-primary/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-2xl">
                                        {selectedIcon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-text/60 dark:text-gray-400">Signed in as</p>
                                        <p className="text-sm font-semibold text-text dark:text-white truncate">{currentUser.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Menu Items */}
                            <div className="p-2">
                                <button
                                    onClick={handleChangeProfilePicture}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-text dark:text-gray-300 hover:text-text dark:hover:text-white transition-all"
                                >
                                    <Camera size={18} />
                                    <span className="text-sm">Change Profile Picture</span>
                                </button>

                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-text dark:text-gray-300 hover:text-text dark:hover:text-white transition-all"
                                >
                                    <LogOut size={18} />
                                    <span className="text-sm">Sign Out</span>
                                </button>

                                <hr className="my-2 border-white/10" />

                                <button
                                    onClick={handleDeleteAccount}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-500 hover:text-red-400 transition-all"
                                >
                                    <Trash2 size={18} />
                                    <span className="text-sm">Delete Account</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProfileMenu;
