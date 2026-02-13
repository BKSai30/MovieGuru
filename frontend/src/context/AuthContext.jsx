
import { createContext, useContext, useEffect, useState } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Fetch additional user data from Firestore
                const userDocRef = doc(db, 'users', user.email);
                const userDoc = await getDoc(userDocRef);
                let userData = { email: user.email, uid: user.uid, profileIcon: '👤' };

                if (userDoc.exists()) {
                    userData = { ...userData, ...userDoc.data() };
                }
                setCurrentUser(userData);
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    async function signup(email, password) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Create user document in Firestore
            const userData = {
                email: user.email,
                profileIcon: '👤',
                favorites: [],
                createdAt: new Date().toISOString()
            };

            await setDoc(doc(db, 'users', user.email), userData);
            setCurrentUser({ ...userData, uid: user.uid });
            return user;
        } catch (error) {
            console.error("Signup error:", error);
            throw error;
        }
    }

    async function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    async function updateProfileIcon(profileIcon) {
        if (!currentUser) return;

        try {
            const userDocRef = doc(db, 'users', currentUser.email);
            // Ensure document exists before update
            const docSnap = await getDoc(userDocRef);
            if (!docSnap.exists()) {
                await setDoc(userDocRef, { email: currentUser.email, favorites: [], profileIcon }, { merge: true });
            } else {
                await updateDoc(userDocRef, { profileIcon });
            }

            setCurrentUser(prev => ({ ...prev, profileIcon }));
        } catch (error) {
            console.error("Update profile error:", error);
            throw error;
        }
    }

    function logout() {
        return signOut(auth);
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
