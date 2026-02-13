// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyASU3W4UNd4zellecJte53Ed13Jg4MIXjc",
    authDomain: "dealsfilter-a5c7f.firebaseapp.com",
    projectId: "dealsfilter-a5c7f",
    storageBucket: "dealsfilter-a5c7f.firebasestorage.app",
    messagingSenderId: "850739620168",
    appId: "1:850739620168:web:332c15b0aec029d8146b7d",
    measurementId: "G-5QMJPT2L0E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
