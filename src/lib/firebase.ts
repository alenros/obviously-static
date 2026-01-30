import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { getAnalytics, type Analytics } from 'firebase/analytics';

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
    authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.PUBLIC_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.PUBLIC_FIREBASE_APP_ID
};

// Singleton Firebase instance
let firebaseApp: firebase.app.App;
let database: firebase.database.Database;
let analytics: Analytics | undefined;

/**
 * Initialize Firebase if not already initialized
 * Safe for both client and server-side rendering
 */
function initializeFirebase(): firebase.app.App {
    if (!firebase.apps.length) {
        firebaseApp = firebase.initializeApp(firebaseConfig);
    } else {
        firebaseApp = firebase.app();
    }
    return firebaseApp;
}

/**
 * Get Firebase database instance
 * Lazy initialization pattern
 */
function getDatabase(): firebase.database.Database {
    if (!database) {
        const app = initializeFirebase();
        database = firebase.database();
    }
    return database;
}

/**
 * Get Firebase analytics instance (client-side only)
 * Optional analytics support
 */
function getFirebaseAnalytics(): Analytics | undefined {
    if (typeof window !== 'undefined' && !analytics) {
        try {
            const app = initializeFirebase();
            analytics = getAnalytics(app);
        } catch (error) {
            console.warn('Firebase Analytics not available:', error);
        }
    }
    return analytics;
}

/**
 * Get initialized Firebase app instance
 */
function getFirebaseApp(): firebase.app.App {
    return initializeFirebase();
}

// Export the singleton instances and helper functions
export {
    firebase,
    getDatabase,
    getFirebaseAnalytics,
    getFirebaseApp,
    firebaseConfig
};

// For backward compatibility, export default firebase instance
export default firebase;