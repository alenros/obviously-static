import type { GameController } from './game-controller';
import { showMessage, clearWordInput } from './game-ui';

export class GameEventHandler {
    private gameController: GameController;

    constructor(gameController: GameController) {
        this.gameController = gameController;
    }

    /**
     * Sets up all game event listeners
     */
    public setupEventListeners(): void {
        this.setupWordSubmissionEvents();
        this.setupLeaveGameEvent();
        this.setupKeyboardEvents();
    }

    /**
     * Sets up word submission event handlers
     */
    private setupWordSubmissionEvents(): void {
        const submitWordBtn = document.getElementById('submit-word-btn');
        submitWordBtn?.addEventListener('click', async () => {
            await this.handleWordSubmission();
        });
    }

    /**
     * Sets up leave game event handler
     */
    private setupLeaveGameEvent(): void {
        const leaveGameBtn = document.getElementById('leave-game-btn');
        leaveGameBtn?.addEventListener('click', async () => {
            await this.handleLeaveGame();
        });
    }

    /**
     * Sets up keyboard event handlers
     */
    private setupKeyboardEvents(): void {
        const wordInput = document.getElementById('word-input') as HTMLInputElement;
        wordInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const submitBtn = document.getElementById('submit-word-btn');
                submitBtn?.click();
            }
        });
    }

    /**
     * Handles word submission
     */
    private async handleWordSubmission(): Promise<void> {
        const wordInput = document.getElementById('word-input') as HTMLInputElement;
        const word = wordInput?.value.trim();

        if (!word) {
            alert('Please enter a word');
            return;
        }

        try {
            await this.gameController.submitWord(word);
            clearWordInput();
            showMessage('Word submitted!', 'success');
        } catch (error) {
            console.error('Error submitting word:', error);
            if (error instanceof Error) {
                alert(error.message);
            } else {
                alert('Failed to submit word');
            }
        }
    }

    /**
     * Handles leaving the game
     */
    private async handleLeaveGame(): Promise<void> {
        try {
            await this.gameController.leaveGame();
            window.location.href = '/';
        } catch (error) {
            console.error('Error leaving game:', error);
            if (error instanceof Error) {
                alert(error.message);
            } else {
                alert('Failed to leave game');
            }
        }
    }

    /**
     * Cleans up all event listeners
     */
    public cleanup(): void {
        // Remove event listeners if needed
        const submitWordBtn = document.getElementById('submit-word-btn');
        const leaveGameBtn = document.getElementById('leave-game-btn');
        const wordInput = document.getElementById('word-input');

        if (submitWordBtn) {
            submitWordBtn.replaceWith(submitWordBtn.cloneNode(true));
        }
        if (leaveGameBtn) {
            leaveGameBtn.replaceWith(leaveGameBtn.cloneNode(true));
        }
        if (wordInput) {
            wordInput.replaceWith(wordInput.cloneNode(true));
        }
    }
}

/**
 * Factory function to create and setup game event handler
 */
export function createGameEventHandler(gameController: GameController): GameEventHandler {
    const eventHandler = new GameEventHandler(gameController);
    eventHandler.setupEventListeners();
    return eventHandler;
}