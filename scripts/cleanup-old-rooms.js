/**
 * Firebase cleanup script - removes rooms older than 24 hours
 * Usage: node scripts/cleanup-old-rooms.js
 */

import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: process.env.PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const database = firebase.database();

async function cleanupOldRooms() {
    try {
        console.log('🧹 Starting Firebase cleanup...');
        
        // Get all rooms
        const roomsSnapshot = await database.ref('rooms').once('value');
        const rooms = roomsSnapshot.val();
        
        if (!rooms) {
            console.log('No rooms found in database.');
            return;
        }
        
        const now = Date.now();
        const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
        
        let deletedCount = 0;
        let keptCount = 0;
        
        for (const [roomCode, roomData] of Object.entries(rooms)) {
            const createdAt = roomData.createdAt || roomData.startTime;
            
            if (!createdAt) {
                console.log(`⚠️  Room ${roomCode} has no timestamp, keeping it...`);
                keptCount++;
                continue;
            }
            
            if (createdAt < twentyFourHoursAgo) {
                console.log(`🗑️  Deleting room ${roomCode} (age: ${Math.floor((now - createdAt) / 3600000)}h)`);
                await database.ref(`rooms/${roomCode}`).remove();
                deletedCount++;
            } else {
                keptCount++;
            }
        }
        
        console.log('\n✅ Cleanup complete!');
        console.log(`   Deleted: ${deletedCount} rooms`);
        console.log(`   Kept: ${keptCount} rooms`);
        
        // Disconnect
        await database.goOffline();
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        process.exit(1);
    }
}

// Run cleanup
cleanupOldRooms();
