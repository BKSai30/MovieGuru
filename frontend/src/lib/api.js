
import axios from 'axios';
import { auth, db } from './firebase';
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs
} from 'firebase/firestore';

const api = axios.create({
    baseURL: '/api',
});

// Helper to get current user
const getCurrentUser = () => {
    return auth.currentUser;
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
        const userDocRef = doc(db, 'users', user.email);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            return userDoc.data().favorites || [];
        }
        return [];
    } catch (error) {
        console.error("Error fetching favorites:", error);
        return [];
    }
};

export const toggleFavorite = async (movie) => {
    const user = getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    try {
        const userDocRef = doc(db, 'users', user.email);
        const userDoc = await getDoc(userDocRef);

        // Ensure user doc exists (it should if they signed up)
        if (!userDoc.exists()) {
            await setDoc(userDocRef, { favorites: [], email: user.email }, { merge: true });
        }

        const currentFavs = userDoc.exists() ? (userDoc.data().favorites || []) : [];
        const isFavorite = currentFavs.some(f => f.id === movie.id);

        let newFavs;
        if (isFavorite) {
            newFavs = currentFavs.filter(f => f.id !== movie.id);
            await updateDoc(userDocRef, {
                favorites: arrayRemove(currentFavs.find(f => f.id === movie.id)) // strict object equality might fail, so filters are safer but arrayRemove needs exact obj. 
                // Firestore arrayRemove only works if object is IDENTICAL.
                // Safest to just write the whole filtered array for client-side toggle consistency.
            });
            // Re-write entire array to be safe against object reference differences
            await updateDoc(userDocRef, { favorites: newFavs });
        } else {
            // Clean movie object
            const movieData = {
                id: movie.id,
                title: movie.title,
                poster_path: movie.poster_path || null,
                release_date: movie.release_date || '',
                overview: movie.overview || '',
                vote_average: movie.vote_average || 0
            };
            newFavs = [...currentFavs, movieData];
            await updateDoc(userDocRef, {
                favorites: arrayUnion(movieData)
            });
        }

        return { favorites: newFavs, status: isFavorite ? 'removed' : 'added' };
    } catch (error) {
        console.error("Error toggling favorite:", error);
        throw error;
    }
};

export const getHistory = async () => {
    const user = getCurrentUser();
    if (!user) return [];

    try {
        const q = query(
            collection(db, 'search_history'),
            where('email', '==', user.email),
            orderBy('timestamp', 'desc'),
            limit(20)
        );

        const querySnapshot = await getDocs(q);
        const history = [];
        querySnapshot.forEach((doc) => {
            history.push({ id: doc.id, ...doc.data() });
        });
        return history;
    } catch (error) {
        console.error("Error fetching history:", error);
        return [];
    }
};

export const getMovieProviders = async (id) => {
    const response = await api.get(`/movie/${id}/providers`);
    return response.data;
};

export default api;
