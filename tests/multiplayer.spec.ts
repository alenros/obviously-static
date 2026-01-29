import { test, expect, chromium, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { createPlayerAndRoom, joinRoom, cleanupRoom, waitForPlayer } from './helpers';

test.describe('Two-Player Room Flow', () => {
  let browser: Browser;
  let player1Context: BrowserContext;
  let player2Context: BrowserContext;
  let player1Page: Page;
  let player2Page: Page;
  let roomCode: string;

  test.beforeAll(async () => {
    browser = await chromium.launch();
    player1Context = await browser.newContext();
    player2Context = await browser.newContext();
    player1Page = await player1Context.newPage();
    player2Page = await player2Context.newPage();
  });

  test.afterAll(async () => {
    if (roomCode) {
      await cleanupRoom(roomCode);
    }
    await browser.close();
  });

  test('Player 1 creates room, Player 2 joins, both see each other in lobby', async () => {
    // PLAYER 1: Create Room
    console.log('Player 1 (Alice) creating room...');
    roomCode = await createPlayerAndRoom(player1Page, 'Alice');
    
    console.log(`Room created with code: ${roomCode}`);
    expect(roomCode).toBeTruthy();
    expect(roomCode).toHaveLength(6);
    
    // Verify Player 1 is in lobby
    await expect(player1Page.locator('text=Alice')).toBeVisible();
    await expect(player1Page.locator(`text=${roomCode}`)).toBeVisible();
    
    // PLAYER 2: Join Room
    console.log('Player 2 (Bob) joining room...');
    await joinRoom(player2Page, 'Bob', roomCode);
    
    console.log('Both players in lobby, checking visibility...');
    
    // VERIFY: Both players see each other in lobby
    await waitForPlayer(player1Page, 'Bob');
    await expect(player1Page.locator('text=Bob')).toBeVisible({ timeout: 5000 });
    
    await expect(player2Page.locator('text=Alice')).toBeVisible();
    await expect(player2Page.locator('text=Bob')).toBeVisible();
    
    console.log('✓ Both players visible in lobby');
    
    // Take screenshots of final state
    await player1Page.screenshot({ path: 'test-results/screenshots/player1-lobby.png', fullPage: true });
    await player2Page.screenshot({ path: 'test-results/screenshots/player2-lobby.png', fullPage: true });
  });

  test('Player 1 (host) can start game, both redirect to game page', async () => {
    // Setup: Create room + join
    console.log('Setting up room for start game test...');
    roomCode = await createPlayerAndRoom(player1Page, 'Alice');
    await joinRoom(player2Page, 'Bob', roomCode);
    
    // Wait for both players to be in lobby
    await waitForPlayer(player1Page, 'Bob');
    
    // PLAYER 1 (Host): Start Game
    console.log('Player 1 starting game...');
    const startButton = player1Page.locator('button:has-text("Start Game"), #start-game-btn');
    await expect(startButton).toBeVisible({ timeout: 5000 });
    await expect(startButton).toBeEnabled();
    await startButton.click();
    
    // VERIFY: Both players redirect to game page
    console.log('Waiting for redirect to game...');
    await Promise.all([
      player1Page.waitForURL(/\/game\?code=/, { timeout: 10000 }),
      player2Page.waitForURL(/\/game\?code=/, { timeout: 10000 })
    ]);
    
    console.log('Both players on game page, checking elements...');
    
    // VERIFY: Game elements visible for both players
    await expect(player1Page.locator('text=Alice')).toBeVisible();
    await expect(player1Page.locator('text=Bob')).toBeVisible();
    await expect(player2Page.locator('text=Alice')).toBeVisible();
    await expect(player2Page.locator('text=Bob')).toBeVisible();
    
    // Check timer or game status is visible
    const gameElements = player1Page.locator('.timer, #timer, .game-status, #game-status');
    await expect(gameElements.first()).toBeVisible({ timeout: 5000 });
    
    console.log('✓ Game started successfully for both players');
    
    // Take screenshots of final game state
    await player1Page.screenshot({ path: 'test-results/screenshots/player1-game.png', fullPage: true });
    await player2Page.screenshot({ path: 'test-results/screenshots/player2-game.png', fullPage: true });
  });
});

test.describe('Edge Cases', () => {
  let browser: Browser;
  let playerContext: BrowserContext;
  let playerPage: Page;

  test.beforeAll(async () => {
    browser = await chromium.launch();
    playerContext = await browser.newContext();
    playerPage = await playerContext.newPage();
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test('Invalid room code shows error or stays on join page', async () => {
    await playerPage.goto('/');
    await playerPage.fill('#player-name', 'TestUser');
    await playerPage.click('#join-room-btn');
    
    await playerPage.waitForURL('/join');
    await playerPage.fill('#join-code', 'INVALID');
    await playerPage.click('#join-room-btn');
    
    // Wait a bit to see if error appears or stays on page
    await playerPage.waitForTimeout(2000);
    
    // Should either show error message or stay on join page
    const currentUrl = playerPage.url();
    const hasError = await playerPage.locator('text=/room.*not.*found/i, text=/invalid/i, .error').count() > 0;
    
    expect(hasError || currentUrl.includes('/join')).toBeTruthy();
    console.log('✓ Invalid room code handled correctly');
  });

  test('Empty player name shows validation', async () => {
    await playerPage.goto('/');
    
    // Try to create room without name
    await playerPage.click('#create-room-btn');
    
    // Should either show alert or stay on page
    await playerPage.waitForTimeout(1000);
    
    // Check if still on home page (validation working)
    expect(playerPage.url()).toContain('localhost:4321');
    expect(playerPage.url()).not.toContain('/lobby');
    
    console.log('✓ Empty name validation works');
    
    // Take screenshot of validation state
    await playerPage.screenshot({ path: 'test-results/screenshots/empty-name-validation.png', fullPage: true });
  });
});

test.describe('Non-Host Restrictions', () => {
  let browser: Browser;
  let player1Context: BrowserContext;
  let player2Context: BrowserContext;
  let player1Page: Page;
  let player2Page: Page;
  let roomCode: string;

  test.beforeAll(async () => {
    browser = await chromium.launch();
    player1Context = await browser.newContext();
    player2Context = await browser.newContext();
    player1Page = await player1Context.newPage();
    player2Page = await player2Context.newPage();
  });

  test.afterAll(async () => {
    if (roomCode) {
      await cleanupRoom(roomCode);
    }
    await browser.close();
  });

  test('Player 2 (non-host) cannot start game', async () => {
    console.log('Testing non-host start game restriction...');
    roomCode = await createPlayerAndRoom(player1Page, 'HostPlayer');
    await joinRoom(player2Page, 'GuestPlayer', roomCode);
    
    await waitForPlayer(player1Page, 'GuestPlayer');
    
    // Player 2 should NOT see start button or it should be disabled
    const startButtonVisible = await player2Page.locator('button:has-text("Start Game"), #start-game-btn').isVisible({ timeout: 2000 }).catch(() => false);
    
    if (startButtonVisible) {
      // If visible, it should be disabled
      const startButton = player2Page.locator('button:has-text("Start Game"), #start-game-btn');
      await expect(startButton).toBeDisabled();
      console.log('✓ Start button is disabled for non-host');
    } else {
      console.log('✓ Start button not visible for non-host');
    }
  });
});
