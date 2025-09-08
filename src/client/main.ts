import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { getAnalytics } from "firebase/analytics";
import { Room } from './room';
import { Player } from './player';


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


// Game state
let currentRoom = null;
let currentPlayer = null;
let gameTimer = null;
let timeLeft = 60;

// Generate unique player ID using Firebase
export function generatePlayerId() {
    // Use Firebase's push() to generate a unique key, then use just the key
    return database.ref().child('temp').push().key;
}

// Sample word prompts
const prompts = [
    "Animals", "Foods", "Colors", "Countries", "Movies",
    "Sports", "Professions", "Things that are round",
    "Things you find in a kitchen", "Words that start with 'B'"
];

// Utility functions
export function generateRoomCode() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
}

export function showMessage(message, type = 'success') {
    const messageArea = document.getElementById('message-area');
    messageArea.innerHTML = `<div class="${type}">${message}</div>`;
    setTimeout(() => messageArea.innerHTML = '', 3000);
}

export function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Navigation functions
export function showHome() {
    showScreen('home-screen');
}

export function showCreateRoom() {
    const playerName = document.getElementById('player-name').value.trim();
    if (!playerName) {
        showMessage('Please enter your name first', 'error');
        return;
    }
    showScreen('create-room-screen');
}

export function showJoinRoom() {
    const playerName = document.getElementById('player-name').value.trim();
    if (!playerName) {
        showMessage('Please enter your name first', 'error');
        return;
    }
    showScreen('join-room-screen');
}

// Room management
export async function createRoom() {
    const playerName = document.getElementById('player-name').value.trim();
    const roomName = document.getElementById('room-name').value.trim() || 'Word Battle Room';

    const roomCode = generateRoomCode();
    const playerId = generatePlayerId();

    const roomData = {
        code: roomCode,
        name: roomName,
        host: playerId,
        status: 'waiting',
        players: {
            [playerId]: {
                name: playerName,
                isHost: true,
                joinedAt: Date.now()
            }
        },
        createdAt: Date.now()
    };

    try {
        await database.ref('rooms/' + roomCode).set(roomData);
        currentRoom = roomCode;
        currentPlayer = playerId;

        document.getElementById('display-room-code').textContent = roomCode;
        showScreen('waiting-room-screen');
        listenToRoom();
        showMessage('Room created successfully!');
    } catch (error) {
        showMessage('Error creating room: ' + error.message, 'error');
    }
}

export async function joinRoom() {
    const playerName = document.getElementById('player-name').value.trim();
    const roomCode = document.getElementById('join-code').value.trim().toUpperCase();

    if (!roomCode || roomCode.length !== 6) {
        showMessage('Please enter a valid 6-digit room code', 'error');
        return;
    }

    try {
        const roomSnapshot = await database.ref('rooms/' + roomCode).once('value');
        const roomData = roomSnapshot.val();

        if (!roomData) {
            showMessage('Room not found', 'error');
            return;
        }

        if (roomData.status !== 'waiting') {
            showMessage('Game is already in progress', 'error');
            return;
        }

        const playerId = generatePlayerId();
        await database.ref(`rooms/${roomCode}/players/${playerId}`).set({
            name: playerName,
            isHost: false,
            joinedAt: Date.now()
        });

        currentRoom = roomCode;
        currentPlayer = playerId;

        document.getElementById('display-room-code').textContent = roomCode;
        showScreen('waiting-room-screen');
        listenToRoom();
        showMessage('Joined room successfully!');
    } catch (error) {
        showMessage('Error joining room: ' + error.message, 'error');
    }
}

export function listenToRoom() {
    if (!currentRoom) return;

    database.ref('rooms/' + currentRoom).on('value', (snapshot) => {
        const roomData : Room= snapshot.val();
        if (!roomData) {
            showMessage('Room no longer exists', 'error');
            leaveRoom();
            return;
        }

        updatePlayersDisplay(roomData.players);

        // Check if current player is host
        const isHost = roomData.players[currentPlayer]?.isHost;
        const startBtn = document.getElementById('start-game-btn');

        if (isHost && Object.keys(roomData.players).length >= 2) {
            startBtn.style.display = 'block';
        } else {
            startBtn.style.display = 'none';
        }

        // Handle game state changes
        if (roomData.status === 'playing' && document.getElementById('waiting-room-screen').classList.contains('active')) {
            initializeGame(roomData);
        } else if (roomData.status === 'finished') {
            showResults(roomData);
        }
    });
}

export function updatePlayersDisplay(players : Player[]) {
    const container = document.getElementById('players-container');
    container.innerHTML = '';

    Object.entries(players).forEach(([playerId, playerData]) => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player';
        playerDiv.innerHTML = `
                    <span class="player-name">${playerData.name} ${playerData.isHost ? '(Host)' : ''}</span>
                    <span class="player-status">Online</span>
                `;
        container.appendChild(playerDiv);
    });
}

export async function startGame() {
    if (!currentRoom) return;

    const prompt = prompts[Math.floor(Math.random() * prompts.length)];

    await database.ref(`rooms/${currentRoom}`).update({
        status: 'playing',
        currentPrompt: prompt,
        gameStartTime: Date.now(),
        words: {}
    });
}

export function initializeGame(roomData) {
    showScreen('game-screen');
    document.getElementById('current-prompt').textContent = `Find words related to: ${roomData.currentPrompt}`;
    document.getElementById('word-input').disabled = false;
    document.getElementById('submit-word-btn').disabled = false;
    document.getElementById('word-input').focus();

    startGameTimer();
    listenToGameWords();
}

export function startGameTimer() {
    timeLeft = 60;
    updateTimerDisplay();

    gameTimer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

export function updateTimerDisplay() {
    document.getElementById('game-timer').textContent = `Time: ${timeLeft}s`;
}

export async function submitWord() {
    const wordInput = document.getElementById('word-input');
    const word = wordInput.value.trim().toLowerCase();

    if (!word) return;

    try {
        await database.ref(`rooms/${currentRoom}/words`).push({
            word: word,
            player: currentPlayer,
            playerName: document.getElementById('player-name').value,
            timestamp: Date.now()
        });

        wordInput.value = '';
        wordInput.focus();
    } catch (error) {
        showMessage('Error submitting word: ' + error.message, 'error');
    }
}

export function listenToGameWords() {
    database.ref(`rooms/${currentRoom}/words`).on('value', (snapshot) => {
        const words = snapshot.val() || {};
        updateWordsDisplay(words);
    });
}

function updateWordsDisplay(words) {
    const container = document.getElementById('submitted-words');
    container.innerHTML = '';

    Object.values(words).forEach(wordData => {
        const wordDiv = document.createElement('div');
        wordDiv.className = 'word-item';
        wordDiv.innerHTML = `
                    <span>${wordData.word}</span>
                    <span>${wordData.playerName}</span>
                `;
        container.appendChild(wordDiv);
    });
}

async function endGame() {
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }

    await database.ref(`rooms/${currentRoom}`).update({
        status: 'finished',
        gameEndTime: Date.now()
    });
}

function showResults(roomData) {
    showScreen('results-screen');

    const words = roomData.words || {};
    const playerScores = {};

    // Calculate scores (simple: 1 point per word)
    // Object.values(words).forEach(wordData => {
    //     if (!playerScores[wordData.player]) {
    //         playerScores[wordData.player] = {
    //             name: wordData.playerName,
    //             count: 0
    //         };
    //     }
    //     playerScores[wordData.player].count++;
    // });

    const resultsContainer = document.getElementById('final-results');
    resultsContainer.innerHTML = '<h3>Final Scores</h3>';

    // Object.values(playerScores)
    //     .sort((a, b) => b.count - a.count)
    //     .forEach((player, index) => {
    //         const position = index + 1;
    //         const resultDiv = document.createElement('div');
    //         resultDiv.className = 'player';
    //         resultDiv.innerHTML = `
    //                     <span class="player-name">${position}. ${player.name}</span>
    //                     <span class="player-status">${player.count} words</span>
    //                 `;
    //         resultsContainer.appendChild(resultDiv);
    //     });
}

async function playAgain() {
    if (!currentRoom) return;

    await database.ref(`rooms/${currentRoom}`).update({
        status: 'waiting',
        words: null,
        currentPrompt: null,
        gameStartTime: null,
        gameEndTime: null
    });

    showScreen('waiting-room-screen');
}

async function leaveRoom() {
    if (currentRoom && currentPlayer) {
        await database.ref(`rooms/${currentRoom}/players/${currentPlayer}`).remove();

        // If no players left, remove the room
        const roomSnapshot = await database.ref(`rooms/${currentRoom}/players`).once('value');
        if (!roomSnapshot.exists()) {
            await database.ref(`rooms/${currentRoom}`).remove();
        }
    }

    currentRoom = null;
    currentPlayer = null;

    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }

    showScreen('home-screen');
}

// Handle word input submission on Enter
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('word-input').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            submitWord();
        }
    });
});

// Clean up when page is closed
window.addEventListener('beforeunload', function () {
    if (currentRoom && currentPlayer) {
        navigator.sendBeacon('/cleanup', JSON.stringify({
            room: currentRoom,
            player: currentPlayer
        }));
    }
});