
import { Link, useNavigate } from 'react-router-dom';
import { Film, Heart, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { currentUser, logout } = useAuth();
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
        <nav className="bg-surface/80 backdrop-blur-lg fixed w-full z-50 border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl tracking-tighter hover:text-red-500 transition">
                        <Film size={24} />
                        <span>MovieGuru</span>
                    </Link>
                    <div className="flex items-center space-x-6 text-sm font-medium">
                        {currentUser ? (
                            <>
                                <Link to="/" className="flex items-center gap-1.5 text-gray-300 hover:text-white transition group">
                                    <span className="group-hover:text-primary">Discover</span>
                                </Link>
                                <Link to="/saved" className="flex items-center gap-1.5 text-gray-300 hover:text-white transition group">
                                    <Heart size={16} className="group-hover:text-primary" />
                                    <span className="group-hover:text-primary">Saved</span>
                                </Link>
                                <div className="flex items-center gap-4 border-l border-white/10 pl-6">
                                    <span className="text-gray-400 text-xs hidden sm:block">{currentUser.email}</span>
                                    <button onClick={handleLogout} className="flex items-center gap-1.5 text-gray-300 hover:text-white transition group">
                                        <LogOut size={16} className="group-hover:text-red-500" />
                                        <span className="group-hover:text-red-500">Logout</span>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link to="/login" className="text-gray-300 hover:text-white transition">Log In</Link>
                                <Link to="/signup" className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-md transition-colors">Sign Up</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
