import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const USE_FIREBASE = process.env.NEXT_PUBLIC_USE_FIREBASE === 'true';

// Initialize Firebase (Singleton pattern)
let app: any = null;
let auth: any = null;
let db: any = null;

if (USE_FIREBASE) {
    console.log("Initializing Firebase with project:", firebaseConfig.projectId);
    try {
        app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        console.log("Firebase initialized successfully");
    } catch (error) {
        console.error("Firebase initialization failed:", error);
    }
} else {
    console.log("Firebase is DISABLED (Local Mode)");
}

export { app, auth, db };
