import type { Room } from './room';
import type { GameState, TimerConfig } from './game-types';
import { updateGamePlayersList, updateTimerDisplay, setupGameUI } from './game-ui';

export class GameController {
    private gameTimer: NodeJS.Timeout | null = null;
    private database: any = null;
    private roomCode: string;
    private currentPlayer: any;

    constructor(roomCode: string, currentPlayer: any, database: any) {
        this.roomCode = roomCode;
        this.currentPlayer = currentPlayer;
        this.database = database;
    }

    /**
     * Initializes the game screen with room data
     */
    public startGameScreen(roomData: Room): void {
        // Clean up any existing timer first
        this.cleanupTimer();
        
        // Set up game UI
        const shouldShowSecretWord = roomData.selectedPlayerId !== this.currentPlayer.id;
        setupGameUI(roomData.prompt || '', roomData.secretWord?.text || null, shouldShowSecretWord);
        
        // Update players list for game screen
        updateGamePlayersList(roomData.players, roomData.selectedPlayerId!);
        
        // Start timer
        const startTime = roomData.startTime || Date.now();
        this.startServerBasedTimer(startTime, roomData.duration || 180);
    }

    /**
     * Starts the server-based timer
     */
    private startServerBasedTimer(startTime: number, duration: number): void {
        const updateTimer = () => {
            const now = Date.now();
            const elapsed = Math.floor((now - startTime) / 1000);
            const timeLeft = Math.max(0, duration - elapsed);
            
            updateTimerDisplay(timeLeft);
            
            if (timeLeft <= 0) {
                this.cleanupTimer();
                this.endGame();
                return;
            }
        };
        
        // Clear any existing timer
        this.cleanupTimer();
        
        // Update immediately
        updateTimer();
        
        // Start the interval
        this.gameTimer = setInterval(updateTimer, 1000);
    }

    /**
     * Ends the current game
     */
    private endGame(): void {
        alert("Time's up! Game ended.");
        // Could redirect to results screen or back to lobby
    }

    /**
     * Submits a word to the game
     */
    public async submitWord(word: string): Promise<boolean> {
        if (!word.trim()) {
            throw new Error('Please enter a word');
        }

        try {
            const firebase = await import('./firebase');
            await this.database.ref(`rooms/${this.roomCode}/submissions/${this.currentPlayer.id}`).set({
                playerId: this.currentPlayer.id,
                playerName: this.currentPlayer.name,
                word: word.trim().toLowerCase(),
                timestamp: firebase.firebase.database.ServerValue.TIMESTAMP
            });
            
            return true;
        } catch (error) {
            console.error('Error submitting word:', error);
            throw new Error('Failed to submit word');
        }
    }

    /**
     * Handles leaving the game
     */
    public async leaveGame(): Promise<void> {
        try {
            await this.database.ref(`rooms/${this.roomCode}/players/${this.currentPlayer.id}`).remove();
            
            // Clean up listeners
            this.database.ref(`rooms/${this.roomCode}`).off();
            this.database.ref(`rooms/${this.roomCode}/submissions`).off();
            
            // Clean up timer
            this.cleanupTimer();
            
            // Clear localStorage
            localStorage.removeItem('currentRoom');
            localStorage.removeItem('currentPlayer');
            
        } catch (error) {
            console.error('Error leaving room:', error);
            throw new Error('Failed to leave room');
        }
    }

    /**
     * Sets up database listeners for game updates
     */
    public setupGameListeners(): void {
        // Listen for game submissions updates
        this.database.ref(`rooms/${this.roomCode}/submissions`).on('value', (snapshot: any) => {
            const submissions = snapshot.val() || {};
            // This will be handled by the UI module
            const { updateSubmissionsList } = require('./game-ui');
            updateSubmissionsList(submissions);
        });
    }

    /**
     * Cleans up the game timer
     */
    private cleanupTimer(): void {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
    }

    /**
     * Cleans up all game resources
     */
    public cleanup(): void {
        this.cleanupTimer();
        
        // Clean up database listeners
        if (this.database) {
            this.database.ref(`rooms/${this.roomCode}`).off();
            this.database.ref(`rooms/${this.roomCode}/submissions`).off();
        }
    }
}

/**
 * Factory function to create and initialize a game controller
 */
export async function createGameController(
    roomCode: string,
    currentPlayer: any
): Promise<GameController> {
    const { getDatabase } = await import('./firebase');
    const database = getDatabase();
    
    return new GameController(roomCode, currentPlayer, database);
}