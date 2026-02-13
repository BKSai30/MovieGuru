
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// Helper to get current user email from local storage
const getUserEmail = () => {
    try {
        const user = JSON.parse(localStorage.getItem('movieguru_user'));
        return user?.email;
    } catch {
        return null;
    }
};

export const getRecommendations = async (mood) => {
    const response = await api.post('/recommend', { mood });
    return response.data;
};

export const getFavorites = async () => {
    const email = getUserEmail();
    if (!email) return [];

    try {
        const response = await api.post('/favorites', { email, action: 'get' });
        return response.data;
    } catch (error) {
        console.error("Error fetching favorites:", error);
        return [];
    }
};

export const toggleFavorite = async (movie) => {
    const email = getUserEmail();
    if (!email) throw new Error("User not authenticated");

    try {
        const response = await api.post('/favorites', {
            email,
            movie: {
                ...movie,
                id: movie.id,
                // Ensure these are present
                title: movie.title,
                poster_path: movie.poster_path,
                release_date: movie.release_date,
                overview: movie.overview,
                vote_average: movie.vote_average
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error toggling favorite:", error);
        throw error;
    }
};

export const getHistory = async () => {
    // History is still SQLite in backend, but we need to update endpoint if we want per-user
    // For now, let's just return empty or keep as is (global history)
    const response = await api.get('/history');
    return response.data;
};

export const getMovieProviders = async (id) => {
    const response = await api.get(`/movie/${id}/providers`);
    return response.data;
};

export default api;
