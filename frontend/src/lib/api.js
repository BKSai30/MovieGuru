import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
});

export const getRecommendations = async (mood) => {
    const response = await api.post('/recommend', { mood });
    return response.data;
};

export const getFavorites = async () => {
    const response = await api.get('/favorites');
    return response.data;
};

export const toggleFavorite = async (movie) => {
    const response = await api.post('/favorites', { movie });
    return response.data;
};

export const getHistory = async () => {
    const response = await api.get('/history');
    return response.data;
};

export default api;
