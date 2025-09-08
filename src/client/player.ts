export interface Player {
    name: string;
    id: string;
    isHost: boolean;
};

import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { getAnalytics } from "firebase/analytics";


const firebaseConfig = {
    apiKey: "AIzaSyDDVlYgTLskL79p2-h3X6Ma9GJhqAMixOk",
    authDomain: "fake-artist-2384e.firebaseapp.com",
    databaseURL: "https://fake-artist-2384e-default-rtdb.firebaseio.com/",
    projectId: "fake-artist-2384e",
    storageBucket: "fake-artist-2384e.firebasestorage.app",
    messagingSenderId: "927881312706",
    appId: "1:927881312706:web:eb78ec36480a08df01fe5b",
    measurementId: "G-68K09NQHX9"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = firebase.database();

// Generate unique player ID using Firebase
export function generatePlayerId() {
    // Use Firebase's push() to generate a unique key, then use just the key
    return database.ref().child('temp').push().key;
}

