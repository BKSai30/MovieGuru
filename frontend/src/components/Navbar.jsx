import { Link } from 'react-router-dom';
import { Film, Heart, Clock } from 'lucide-react';

const Navbar = () => {
    return (
        <nav className="bg-surface/80 backdrop-blur-lg fixed w-full z-50 border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl tracking-tighter hover:text-red-500 transition">
                        <Film size={24} />
                        <span>MovieGuru</span>
                    </Link>
                    <div className="flex space-x-6 text-sm font-medium">
                        <Link to="/" className="flex items-center gap-1.5 text-gray-300 hover:text-white transition group">
                            <span className="group-hover:text-primary">Discover</span>
                        </Link>
                        <Link to="/saved" className="flex items-center gap-1.5 text-gray-300 hover:text-white transition group">
                            <Heart size={16} className="group-hover:text-primary" />
                            <span className="group-hover:text-primary">Saved</span>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
