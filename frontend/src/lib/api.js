
import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
});

// Helper to get current user from localStorage since AuthContext might not be accessible here directly
// In a real app, pass user or token via context/props, but for simple util functions:
const getCurrentUser = () => {
    try {
        const storedUser = localStorage.getItem('movieguru_user');
        return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
        return null;
    }
};

export const getRecommendations = async (mood) => {
    const user = getCurrentUser();
    const email = user ? user.email : null;
    // We still call the backend for AI processing
    const response = await api.post('/recommend', { mood, email });
    return response.data;
};

export const getFavorites = async () => {
    const user = getCurrentUser();
    if (!user) return [];

    try {
        const response = await api.post('/favorites', {
            email: user.email,
            action: 'get'
        });
        return response.data || [];
    } catch (error) {
        console.error("Error fetching favorites:", error);
        return [];
    }
};

export const toggleFavorite = async (movie) => {
    const user = getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    try {
        const response = await api.post('/favorites', {
            email: user.email,
            movie: movie
        });
        return response.data; // { status: 'added'/'removed', favorites: [...] }
    } catch (error) {
        console.error("Error toggling favorite:", error);
        throw error;
    }
};

export const getHistory = async () => {
    const user = getCurrentUser();
    if (!user) return [];

    try {
        const response = await api.get('/history', {
            params: { email: user.email }
        });
        return response.data || [];
    } catch (error) {
        console.error("Error fetching history:", error);
        return [];
    }
};

export const deleteHistory = async (historyId) => {
    try {
        await api.delete(`/history/${historyId}`);
        return true;
    } catch (error) {
        console.error("Error deleting history:", error);
        throw error;
    }
};


export const getMovieProviders = async (id) => {
    // This seems unimplemented in backend yet, keep placeholder if needed or remove depending on usage
    // For now, return empty
    return [];
};

export default api;
