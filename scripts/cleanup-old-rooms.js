/**
 * Firebase cleanup script - removes rooms older than 24 hours
 * Usage: node scripts/cleanup-old-rooms.js
 */

import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDDVlYgTLskL79p2-h3X6Ma9GJhqAMixOk",
    authDomain: "fake-artist-2384e.firebaseapp.com",
    databaseURL: "https://fake-artist-2384e-default-rtdb.firebaseio.com/",
    projectId: "fake-artist-2384e",
    storageBucket: "fake-artist-2384e.firebasestorage.app",
    messagingSenderId: "927881312706",
    appId: "1:927881312706:web:a4e96f46b8c85db39b4e9b"
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
