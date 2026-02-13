
import { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage on load
        const storedUser = localStorage.getItem('movieguru_user');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    async function signup(email, password) {
        try {
            const response = await api.post('/signup', { email, password });
            const user = {
                email: response.data.email,
                profileIcon: response.data.profileIcon || '👤'
            };
            setCurrentUser(user);
            localStorage.setItem('movieguru_user', JSON.stringify(user));
            return user;
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Signup failed');
        }
    }

    async function login(email, password) {
        try {
            const response = await api.post('/login', { email, password });
            const user = {
                email: response.data.email,
                profileIcon: response.data.profileIcon || '👤'
            };
            setCurrentUser(user);
            localStorage.setItem('movieguru_user', JSON.stringify(user));
            return user;
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Login failed');
        }
    }

    async function updateProfileIcon(profileIcon) {
        try {
            await api.put('/profile/icon', {
                email: currentUser.email,
                profileIcon
            });
            const updatedUser = { ...currentUser, profileIcon };
            setCurrentUser(updatedUser);
            localStorage.setItem('movieguru_user', JSON.stringify(updatedUser));
            return updatedUser;
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Update failed');
        }
    }

    function logout() {
        setCurrentUser(null);
        localStorage.removeItem('movieguru_user');
    }

    const value = {
        currentUser,
        signup,
        login,
        logout,
        updateProfileIcon
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
