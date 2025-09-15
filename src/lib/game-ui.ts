import type { PlayerGameStatus, GameSubmission } from './game-types';

/**
 * Updates the game players list in the UI
 */
export function updateGamePlayersList(players: any, selectedPlayerId: string): void {
    const container = document.getElementById('game-players-container');
    if (!container || !players) return;
    
    container.innerHTML = '';
    
    Object.values(players).forEach((player: any) => {
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

/**
 * Updates the submissions list in the UI
 */
export function updateSubmissionsList(submissions: any): void {
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

/**
 * Updates the timer display
 */
export function updateTimerDisplay(timeLeft: number): void {
    const timerElement = document.getElementById('game-timer');
    if (!timerElement) return;
    
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    timerElement.textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Sets up the game UI with initial data
 */
export function setupGameUI(
    prompt: string, 
    secretWord: string | null, 
    shouldShowSecretWord: boolean
): void {
    const promptElement = document.getElementById('current-prompt');
    const secretWordElement = document.getElementById('secret-word');
    const secretWordDisplay = document.getElementById('secret-word-display');
    const wordInput = document.getElementById('word-input') as HTMLInputElement;
    const submitBtn = document.getElementById('submit-word-btn') as HTMLButtonElement;
    
    if (promptElement) {
        promptElement.textContent = `Category: ${prompt}`;
    }
    
    // Show secret word to appropriate players
    if (shouldShowSecretWord && secretWord) {
        if (secretWordElement) {
            secretWordElement.textContent = secretWord;
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
}

/**
 * Shows a temporary message to the user
 */
export function showMessage(message: string, type: 'success' | 'error' = 'success'): void {
    const messageArea = document.getElementById('message-area');
    if (messageArea) {
        messageArea.innerHTML = `<div class="${type}">${message}</div>`;
        setTimeout(() => {
            messageArea.innerHTML = '';
        }, 3000);
    }
}

/**
 * Clears the word input field
 */
export function clearWordInput(): void {
    const wordInput = document.getElementById('word-input') as HTMLInputElement;
    if (wordInput) {
        wordInput.value = '';
    }
}