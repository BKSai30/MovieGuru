
import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Signup() {
    const emailRef = useRef();
    const passwordRef = useRef();
    const passwordConfirmRef = useRef();
    const { signup } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        if (passwordRef.current.value !== passwordConfirmRef.current.value) {
            return setError('Passwords do not match');
        }

        try {
            setError('');
            setLoading(true);
            await signup(emailRef.current.value, passwordRef.current.value);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Failed to create an account');
        }

        setLoading(false);
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-md bg-surface border border-white/10 p-8 rounded-xl shadow-2xl backdrop-blur-sm">
                <h2 className="text-3xl font-bold text-center text-white mb-8">Sign Up</h2>
                {error && <div className="bg-red-500/20 text-red-100 p-3 rounded mb-4 text-center border border-red-500/30">{error}</div>}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-text/70 dark:text-gray-400 mb-2 text-sm">Email</label>
                        <input type="email" ref={emailRef} required className="w-full bg-black/50 border border-white/10 rounded px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" />
                    </div>
                    <div>
                        <label className="block text-text/70 dark:text-gray-400 mb-2 text-sm">Password</label>
                        <input type="password" ref={passwordRef} required className="w-full bg-black/50 border border-white/10 rounded px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" />
                    </div>
                    <div>
                        <label className="block text-text/70 dark:text-gray-400 mb-2 text-sm">Password Confirmation</label>
                        <input type="password" ref={passwordConfirmRef} required className="w-full bg-black/50 border border-white/10 rounded px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" />
                    </div>
                    <button disabled={loading} type="submit" className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-3 rounded transition-colors mt-4">
                        Sign Up
                    </button>
                </form>
                <div className="w-100 text-center mt-6 text-text/70 dark:text-gray-400">
                    Already have an account? <Link to="/login" className="text-primary hover:underline">Log In</Link>
                </div>
            </div>
        </div>
    );
}
