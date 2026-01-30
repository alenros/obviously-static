import type { Page } from '@playwright/test';

/**
 * Helper function: Create a player and a new room
 * @param page - Playwright page object
 * @param playerName - Name of the player
 * @returns Room code
 */
export async function createPlayerAndRoom(page: Page, playerName: string): Promise<string> {
  await page.goto('/');
  await page.fill('#player-name', playerName);
  await page.click('#create-room-btn');
  await page.waitForURL(/\/lobby\?code=/, { timeout: 10000 });
  
  const url = new URL(page.url());
  const roomCode = url.searchParams.get('code');
  
  if (!roomCode) {
    throw new Error('Failed to extract room code from URL');
  }
  
  return roomCode;
}

/**
 * Helper function: Join an existing room
 * @param page - Playwright page object
 * @param playerName - Name of the player
 * @param roomCode - 6-character room code
 */
export async function joinRoom(page: Page, playerName: string, roomCode: string): Promise<void> {
  await page.goto('/');
  await page.fill('#player-name', playerName);
  await page.click('#join-room-btn');
  
  // Wait for join page
  await page.waitForURL('/join', { timeout: 5000 });
  
  // Enter room code and join
  await page.fill('#join-code', roomCode);
  await page.click('#join-room-btn');
  
  // Wait for redirect to lobby
  await page.waitForURL(/\/lobby\?code=/, { timeout: 10000 });
}

/**
 * Helper function: Clean up Firebase room after test
 * @param roomCode - Room code to delete
 */
export async function cleanupRoom(roomCode: string): Promise<void> {
  if (!roomCode) return;
  
  try {
    // Dynamic import to avoid build-time Firebase initialization
    const { getDatabase } = await import('../src/lib/firebase');
    const db = getDatabase();
    await db.ref(`rooms/${roomCode}`).remove();
    console.log(`Cleaned up room: ${roomCode}`);
    
    // Wait a bit to ensure Firebase propagates the deletion
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (error) {
    console.warn(`Failed to cleanup room ${roomCode}:`, error);
  }
}

/**
 * Helper function: Wait for player to appear in player list
 * @param page - Playwright page object
 * @param playerName - Name to wait for
 */
export async function waitForPlayer(page: Page, playerName: string): Promise<void> {
  await page.waitForSelector(`text=${playerName}`, { timeout: 10000 });
}
