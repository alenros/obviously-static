import firebase, { getDatabase, getFirebaseAnalytics } from '../lib/firebase';
import type { Room } from './room';
import type { Player } from './player';

// Get Firebase instances from singleton
const database = getDatabase();
const analytics = getFirebaseAnalytics();

// Game state
let currentRoom: string | null = null;
let currentPlayer: Player | null = null;
let gameTimer: number | null = null;

// Sample word prompts
const prompts = [
    "Animals", "Foods", "Colors", "Countries", "Movies",
    "Sports", "Professions", "Things that are round",
    "Things you find in a kitchen", "Words that start with 'B'"
];

// Sample words for each prompt
const wordsByPrompt: { [key: string]: string[] } = {
    "Animals": ["cat", "dog", "elephant", "tiger", "bird", "fish", "horse", "cow"],
    "Foods": ["pizza", "burger", "salad", "pasta", "soup", "bread", "cheese", "fruit"],
    "Colors": ["red", "blue", "green", "yellow", "purple", "orange", "pink", "black"],
    "Countries": ["france", "japan", "brazil", "canada", "italy", "spain", "germany", "china"],
    "Movies": ["avatar", "titanic", "batman", "superman", "starwars", "marvel", "disney", "action"],
    "Sports": ["football", "basketball", "tennis", "soccer", "baseball", "swimming", "running", "golf"],
    "Professions": ["doctor", "teacher", "engineer", "artist", "chef", "pilot", "nurse", "lawyer"],
    "Things that are round": ["ball", "coin", "wheel", "planet", "orange", "clock", "ring", "button"],
    "Things you find in a kitchen": ["stove", "fridge", "knife", "plate", "cup", "spoon", "sink", "oven"],
    "Words that start with 'B'": ["banana", "butterfly", "book", "building", "bridge", "bottle", "bicycle", "bird"]
};

// Utility functions
export function generateRoomCode(): string {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
}

export function generatePlayerId(): string | null {
    return database.ref().child('temp').push().key;
}

// Screen navigation
function showScreen(screenId: string): void {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show target screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
}

function showMessage(message: string, isError = false): void {
    const messageArea = document.getElementById('message-area');
    if (messageArea) {
        messageArea.innerHTML = `<div class="${isError ? 'error' : 'success'}">${message}</div>`;
        setTimeout(() => {
            messageArea.innerHTML = '';
        }, 5000);
    }
}

// Room management functions
(window as any).showCreateRoom = function() {
    showScreen('create-room-screen');
};

(window as any).showJoinRoom = function() {
    showScreen('join-room-screen');
};

(window as any).showHome = function() {
    showScreen('home-screen');
};

(window as any).createRoom = async function() {
    const playerNameInput = document.getElementById('player-name') as HTMLInputElement;
    const roomNameInput = document.getElementById('room-name') as HTMLInputElement;
    
    const playerName = playerNameInput?.value.trim();
    const roomName = roomNameInput?.value.trim() || 'Unnamed Room';
    
    if (!playerName) {
        showMessage('Please enter your name', true);
        return;
    }
    
    try {
        const roomCode = generateRoomCode();
        const playerId = generatePlayerId();
        
        if (!playerId) {
            showMessage('Failed to generate player ID', true);
            return;
        }
        
        currentPlayer = {
            id: playerId,
            name: playerName,
            isHost: true
        };
        
        const roomData: Room = {
            code: roomCode,
            name: roomName,
            status: 'waiting',
            players: {
                [playerId]: currentPlayer
            },
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            hostId: playerId
        };
        
        await database.ref(`rooms/${roomCode}`).set(roomData);
        currentRoom = roomCode;
        
        joinWaitingRoom(roomCode);
        
    } catch (error) {
        console.error('Error creating room:', error);
        showMessage('Failed to create room', true);
    }
};

(window as any).joinRoom = async function() {
    const playerNameInput = document.getElementById('player-name') as HTMLInputElement;
    const joinCodeInput = document.getElementById('join-code') as HTMLInputElement;
    
    const playerName = playerNameInput?.value.trim();
    const roomCode = joinCodeInput?.value.trim().toUpperCase();
    
    if (!playerName || !roomCode) {
        showMessage('Please enter your name and room code', true);
        return;
    }
    
    if (roomCode.length !== 6) {
        showMessage('Room code must be 6 characters', true);
        return;
    }
    
    try {
        const roomSnapshot = await database.ref(`rooms/${roomCode}`).once('value');
        
        if (!roomSnapshot.exists()) {
            showMessage('Room not found', true);
            return;
        }
        
        const roomData = roomSnapshot.val();
        
        if (roomData.status === 'playing') {
            showMessage('Game is already in progress', true);
            return;
        }
        
        const playerId = generatePlayerId();
        if (!playerId) {
            showMessage('Failed to generate player ID', true);
            return;
        }
        
        currentPlayer = {
            id: playerId,
            name: playerName,
            isHost: false
        };
        
        await database.ref(`rooms/${roomCode}/players/${playerId}`).set(currentPlayer);
        currentRoom = roomCode;
        
        joinWaitingRoom(roomCode);
        
    } catch (error) {
        console.error('Error joining room:', error);
        showMessage('Failed to join room', true);
    }
};

function joinWaitingRoom(roomCode: string): void {
    showScreen('waiting-room-screen');
    
    const roomCodeDisplay = document.getElementById('display-room-code');
    if (roomCodeDisplay) {
        roomCodeDisplay.textContent = roomCode;
    }
    
    // Listen for room updates
    database.ref(`rooms/${roomCode}`).on('value', (snapshot) => {
        const roomData = snapshot.val();
        if (!roomData) {
            showMessage('Room no longer exists', true);
            (window as any).showHome();
            return;
        }
        
        updatePlayersList(roomData.players);
        
        // Show start button only to host
        const startBtn = document.getElementById('start-game-btn');
        if (startBtn && currentPlayer?.isHost) {
            const playerCount = Object.keys(roomData.players || {}).length;
            startBtn.style.display = playerCount >= 2 ? 'block' : 'none';
        }
        
        // Check if game started
        if (roomData.status === 'playing') {
            startGameScreen(roomData);
        }
    });
}

function updatePlayersList(players: { [key: string]: Player }): void {
    const container = document.getElementById('players-container');
    if (!container || !players) return;
    
    container.innerHTML = '';
    
    Object.values(players).forEach((player: Player) => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player';
        playerDiv.innerHTML = `
            <span class="player-name">${player.name}</span>
            ${player.isHost ? '<span class="player-status">Host</span>' : ''}
        `;
        container.appendChild(playerDiv);
    });
}

(window as any).startGame = async function() {
    if (!currentRoom || !currentPlayer?.isHost) return;
    
    try {
        // Select random prompt and secret word
        const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
        const wordsForPrompt = wordsByPrompt[randomPrompt] || [];
        const secretWord = wordsForPrompt[Math.floor(Math.random() * wordsForPrompt.length)] || 'default';
        
        // Get all players and randomly select one to be "it" (the one who doesn't see the word)
        const roomSnapshot = await database.ref(`rooms/${currentRoom}`).once('value');
        const roomData = roomSnapshot.val();
        const playerIds = Object.keys(roomData.players || {});
        const selectedPlayerId = playerIds[Math.floor(Math.random() * playerIds.length)];
        
        const gameData = {
            status: 'playing',
            prompt: randomPrompt,
            secretWord: secretWord,
            selectedPlayerId: selectedPlayerId, // The player who doesn't know the word
            startTime: Date.now(), // Use client timestamp for consistency
            duration: 180, // 3 minutes in seconds
            submissions: {}
        };
        
        await database.ref(`rooms/${currentRoom}`).update(gameData);
        
    } catch (error) {
        console.error('Error starting game:', error);
        showMessage('Failed to start game', true);
    }
};

function startGameScreen(roomData: any): void {
    // Clean up any existing timer first
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
    
    showScreen('game-screen');
    
    // Set up game UI
    const promptElement = document.getElementById('current-prompt');
    const secretWordElement = document.getElementById('secret-word');
    const secretWordDisplay = document.getElementById('secret-word-display');
    const wordInput = document.getElementById('word-input') as HTMLInputElement;
    const submitBtn = document.getElementById('submit-word-btn') as HTMLButtonElement;
    
    if (promptElement) {
        promptElement.textContent = `Category: ${roomData.prompt}`;
    }
    
    // Show secret word to all players except the selected one
    if (currentPlayer && roomData.selectedPlayerId !== currentPlayer.id) {
        if (secretWordElement) {
            secretWordElement.textContent = roomData.secretWord;
        }
        if (secretWordDisplay) {
            secretWordDisplay.style.display = 'block';
        }
    } else {
        if (secretWordDisplay) {
            secretWordDisplay.style.display = 'none';
        }
    }
    
    // Enable input and button
    if (wordInput) wordInput.disabled = false;
    if (submitBtn) submitBtn.disabled = false;
    
    // Update players list for game screen
    updateGamePlayersList(roomData.players, roomData.selectedPlayerId);
    
    // Start timer - use current time if startTime is not properly set
    const startTime = roomData.startTime || Date.now();
    startServerBasedTimer(startTime, roomData.duration || 180);
    
    // Listen for game updates
    database.ref(`rooms/${currentRoom}/submissions`).on('value', (snapshot) => {
        const submissions = snapshot.val() || {};
        updateSubmissionsList(submissions);
    });
}

function updateGamePlayersList(players: { [key: string]: Player }, selectedPlayerId: string): void {
    const container = document.getElementById('game-players-container');
    if (!container || !players) return;
    
    container.innerHTML = '';
    
    Object.values(players).forEach((player: Player) => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player';
        const isSelected = player.id === selectedPlayerId;
        playerDiv.innerHTML = `
            <span class="player-name">${player.name}</span>
            ${isSelected ? '<span class="player-status" style="background: #dc3545;">Doesn\'t Know</span>' : 
                          '<span class="player-status">Knows Word</span>'}
        `;
        container.appendChild(playerDiv);
    });
}

function startServerBasedTimer(startTime: number, duration: number): void {
    const timerElement = document.getElementById('game-timer');
    
    const updateTimer = () => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        const timeLeft = Math.max(0, duration - elapsed);
        
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        if (timerElement) {
            timerElement.textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        if (timeLeft <= 0) {
            if (gameTimer) {
                clearInterval(gameTimer);
                gameTimer = null;
            }
            endGame();
            return;
        }
    };
    
    // Clear any existing timer
    if (gameTimer) {
        clearInterval(gameTimer);
    }
    
    // Update immediately
    updateTimer();
    
    // Start the interval
    gameTimer = setInterval(updateTimer, 1000) as any;
}

function endGame(): void {
    showMessage('Time\'s up! Game ended.');
    // Could implement game results screen here
}

(window as any).submitWord = async function() {
    if (!currentRoom || !currentPlayer) return;
    
    const wordInput = document.getElementById('word-input') as HTMLInputElement;
    const word = wordInput?.value.trim().toLowerCase();
    
    if (!word) {
        showMessage('Please enter a word', true);
        return;
    }
    
    try {
        await database.ref(`rooms/${currentRoom}/submissions/${currentPlayer.id}`).set({
            playerId: currentPlayer.id,
            playerName: currentPlayer.name,
            word: word,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        wordInput.value = '';
        showMessage('Word submitted!');
        
    } catch (error) {
        console.error('Error submitting word:', error);
        showMessage('Failed to submit word', true);
    }
};

function updateSubmissionsList(submissions: any): void {
    const container = document.getElementById('submitted-words');
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.values(submissions).forEach((submission: any) => {
        const submissionDiv = document.createElement('div');
        submissionDiv.className = 'word-item';
        submissionDiv.innerHTML = `
            <span>${submission.playerName}: ${submission.word}</span>
        `;
        container.appendChild(submissionDiv);
    });
}

(window as any).leaveRoom = async function() {
    if (!currentRoom || !currentPlayer) return;
    
    try {
        await database.ref(`rooms/${currentRoom}/players/${currentPlayer.id}`).remove();
        
        // Clean up listeners
        database.ref(`rooms/${currentRoom}`).off();
        database.ref(`rooms/${currentRoom}/submissions`).off();
        
        // Clean up timer
        if (gameTimer) {
            clearInterval(gameTimer);
            gameTimer = null;
        }
        
        currentRoom = null;
        currentPlayer = null;
        
        showScreen('home-screen');
        showMessage('Left the room');
        
    } catch (error) {
        console.error('Error leaving room:', error);
        showMessage('Failed to leave room', true);
    }
};

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    showScreen('home-screen');
});
