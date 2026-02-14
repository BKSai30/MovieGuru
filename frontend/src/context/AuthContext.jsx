
import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const api = axios.create({
    baseURL: '/api',
});

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for persisted user in local storage
        const storedUser = localStorage.getItem('movieguru_user');
        if (storedUser) {
            try {
                setCurrentUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse stored user", e);
            }
        }
        setLoading(false);
    }, []);

    const saveUser = (user) => {
        setCurrentUser(user);
        localStorage.setItem('movieguru_user', JSON.stringify(user));
    };

    async function signup(email, password) {
        try {
            const response = await api.post('/signup', { email, password });
            // Backend returns: { email, favorites, profileIcon }
            const user = response.data;
            saveUser(user); // Automatically login after signup
            return user;
        } catch (error) {
            console.error("Signup error:", error);
            throw error; // Let component handle error
        }
    }

    async function login(email, password) {
        try {
            const response = await api.post('/login', { email, password });
            const user = response.data;
            saveUser(user);
            return user;
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    }

    async function updateProfileIcon(profileIcon) {
        if (!currentUser) return;
        try {
            const response = await api.put('/profile/icon', {
                email: currentUser.email,
                profileIcon
            });
            const updatedUser = { ...currentUser, profileIcon: response.data.profileIcon };
            saveUser(updatedUser);
        } catch (error) {
            console.error("Update profile error:", error);
            throw error;
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

export default AuthProvider;
