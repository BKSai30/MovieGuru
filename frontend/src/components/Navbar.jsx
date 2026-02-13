

import { Link, useNavigate } from 'react-router-dom';
import { Film, Heart, MessageSquare, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ProfileMenu from './ProfileMenu';

const Navbar = () => {
    const { currentUser, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    async function handleLogout() {
        try {
            await logout();
            navigate('/login');
        } catch {
            console.error("Failed to log out");
        }
    }

    return (
        <nav className="bg-surface backdrop-blur-lg fixed w-full z-50 border-b-2 border-primary/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl tracking-tighter hover:text-red-500 transition">
                        <Film size={24} />
                        <span>MovieGuru</span>
                    </Link>

                    <div className="flex items-center gap-6">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg bg-surface/50 hover:bg-surface border border-white/10 text-text hover:text-text transition-all"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        <div className="flex items-center space-x-6 text-sm font-medium">
                            {currentUser ? (
                                <>
                                    <Link to="/" className="flex items-center gap-1.5 text-text/70 hover:text-text dark:text-gray-300 dark:hover:text-white transition group">
                                        <span className="group-hover:text-primary">Discover</span>
                                    </Link>
                                    <Link to="/saved" className="flex items-center gap-1.5 text-text/70 hover:text-text dark:text-gray-300 dark:hover:text-white transition group">
                                        <Heart size={16} className="group-hover:text-primary" />
                                        <span className="group-hover:text-primary">Saved</span>
                                    </Link>
                                    <Link to="/reviews" className="flex items-center gap-1.5 text-text/70 hover:text-text dark:text-gray-300 dark:hover:text-white transition group">
                                        <MessageSquare size={16} className="group-hover:text-primary" />
                                        <span className="group-hover:text-primary">Reviews</span>
                                    </Link>
                                    <div className="flex items-center gap-4 border-l border-white/10 pl-6">
                                        <ProfileMenu />
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <Link to="/login" className="text-text/70 hover:text-text dark:text-gray-300 dark:hover:text-white transition">Log In</Link>
                                    <Link to="/signup" className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-md transition-colors">Sign Up</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
