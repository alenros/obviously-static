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

  test('Player 1 (host) can start game, both redirect to game page, select public words', async () => {
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
    
    // Wait for public words to appear
    console.log('Waiting for public words...');
    await expect(player1Page.locator('.word-item.clickable').first()).toBeVisible({ timeout: 5000 });
    await expect(player2Page.locator('.word-item.clickable').first()).toBeVisible({ timeout: 5000 });
    
    // PLAYER 1: Select first public word
    console.log('Player 1 selecting first public word...');
    const player1Word = player1Page.locator('.word-item.clickable').first();
    await player1Word.click();
    await expect(player1Word).toHaveClass(/selected/);
    
    // PLAYER 1: Submit choice
    console.log('Player 1 submitting choice...');
    const player1SubmitBtn = player1Page.locator('#submit-choice-btn');
    await expect(player1SubmitBtn).toBeEnabled();
    await player1SubmitBtn.click();
    await expect(player1SubmitBtn).toHaveText(/Choice Submitted/);
    
    // Wait for Player 2 to see Player 1's checkmark
    await player2Page.waitForTimeout(1000);
    
    // Take screenshot from Player 2's POV showing Player 1 has submitted
    await player2Page.screenshot({ path: 'test-results/screenshots/player2-sees-player1-submitted.png', fullPage: true });
    console.log('✓ Screenshot taken: Player 2 sees Player 1 submitted');
    
    // PLAYER 2: Select second public word
    console.log('Player 2 selecting second public word...');
    const player2Word = player2Page.locator('.word-item.clickable').nth(1);
    await player2Word.click();
    await expect(player2Word).toHaveClass(/selected/);
    
    // PLAYER 2: Submit choice
    console.log('Player 2 submitting choice...');
    const player2SubmitBtn = player2Page.locator('#submit-choice-btn');
    await expect(player2SubmitBtn).toBeEnabled();
    await player2SubmitBtn.click();
    await expect(player2SubmitBtn).toHaveText(/Choice Submitted/);
    
    // Wait for reveal to trigger and display
    console.log('Waiting for choices to be revealed...');
    await player1Page.waitForTimeout(3000);
    
    console.log('✓ Both players submitted their public word choices');
    
    // Take screenshots of final state (should show reveal if it triggered)
    await player1Page.screenshot({ path: 'test-results/screenshots/player1-game-final.png', fullPage: true });
    await player2Page.screenshot({ path: 'test-results/screenshots/player2-game-final.png', fullPage: true });
    console.log('✓ Screenshots taken: Final game state');
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

test.describe('Scoring System', () => {
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

  test.beforeEach(async () => {
    // Ensure clean state before each test
    roomCode = '';
  });

  test.afterEach(async () => {
    // Clean up room after each test to prevent state carryover
    if (roomCode) {
      console.log(`Cleaning up room ${roomCode}...`);
      await cleanupRoom(roomCode);
      roomCode = '';
    }
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test('Different words selected - should award a point', async () => {
    console.log('Testing different word selection (point scenario)...');
    
    // Setup: Create room, join, start game
    roomCode = await createPlayerAndRoom(player1Page, 'Alice');
    await joinRoom(player2Page, 'Bob', roomCode);
    await waitForPlayer(player1Page, 'Bob');
    
    const startButton = player1Page.locator('button:has-text("Start Game"), #start-game-btn');
    await startButton.click();
    
    await Promise.all([
      player1Page.waitForURL(/\/game\?code=/),
      player2Page.waitForURL(/\/game\?code=/)
    ]);
    
    // Wait for public words to appear
    await expect(player1Page.locator('.word-item.clickable').first()).toBeVisible({ timeout: 5000 });
    await expect(player2Page.locator('.word-item.clickable').first()).toBeVisible({ timeout: 5000 });
    
    // Player 1 selects FIRST word
    console.log('Player 1 selecting first word...');
    const player1Word = player1Page.locator('.word-item.clickable').first();
    await player1Word.click();
    await player1Page.locator('#submit-choice-btn').click();
    
    // Player 2 selects SECOND word (different from Player 1)
    console.log('Player 2 selecting second word (different)...');
    const player2Word = player2Page.locator('.word-item.clickable').nth(1);
    await player2Word.click();
    await player2Page.locator('#submit-choice-btn').click();
    
    // Wait for reveal
    console.log('Waiting for reveal...');
    await player1Page.waitForTimeout(3000);
    
    // Check for reveal display
    await expect(player1Page.locator('text=Choices Revealed!')).toBeVisible({ timeout: 5000 });
    
    // Verify point was awarded
    const pointsDisplay = player1Page.locator('.score-item:has-text("Points:")');
    await expect(pointsDisplay).toContainText('1');
    
    // Verify no foul
    const foulsDisplay = player1Page.locator('.score-item:has-text("Fouls:")');
    await expect(foulsDisplay).toContainText('0');
    
    console.log('✓ Point awarded for different words');
    
    // Take screenshots
    await player1Page.screenshot({ path: 'test-results/screenshots/different-words-player1.png', fullPage: true });
    await player2Page.screenshot({ path: 'test-results/screenshots/different-words-player2.png', fullPage: true });
  });

  test('Same word selected - should award a foul', async () => {
    console.log('Testing same word selection (foul scenario)...');
    
    // Setup: Create room, join, start game
    roomCode = await createPlayerAndRoom(player1Page, 'Alice');
    await joinRoom(player2Page, 'Bob', roomCode);
    await waitForPlayer(player1Page, 'Bob');
    
    const startButton = player1Page.locator('button:has-text("Start Game"), #start-game-btn');
    await startButton.click();
    
    await Promise.all([
      player1Page.waitForURL(/\/game\?code=/),
      player2Page.waitForURL(/\/game\?code=/)
    ]);
    
    // Wait for public words to appear
    await expect(player1Page.locator('.word-item.clickable').first()).toBeVisible({ timeout: 5000 });
    await expect(player2Page.locator('.word-item.clickable').first()).toBeVisible({ timeout: 5000 });
    
    // Player 1 selects FIRST word
    console.log('Player 1 selecting first word...');
    const player1Word = player1Page.locator('.word-item.clickable').first();
    await player1Word.click();
    await player1Page.locator('#submit-choice-btn').click();
    
    // Player 2 ALSO selects FIRST word (same as Player 1)
    console.log('Player 2 selecting first word (same as Player 1)...');
    const player2Word = player2Page.locator('.word-item.clickable').first();
    await player2Word.click();
    await player2Page.locator('#submit-choice-btn').click();
    
    // Wait for reveal
    console.log('Waiting for reveal...');
    await player1Page.waitForTimeout(3000);
    
    // Check for reveal display
    await expect(player1Page.locator('text=Choices Revealed!')).toBeVisible({ timeout: 5000 });
    
    // Verify foul was awarded
    const foulsDisplay = player1Page.locator('.score-item:has-text("Fouls:")');
    await expect(foulsDisplay).toContainText('1');
    
    // Verify no point
    const pointsDisplay = player1Page.locator('.score-item:has-text("Points:")');
    await expect(pointsDisplay).toContainText('0');
    
    // Verify duplicate highlighting
    await expect(player1Page.locator('.revealed-word.duplicate')).toBeVisible();
    
    console.log('✓ Foul awarded for same word selection');
    
    // Take screenshots
    await player1Page.screenshot({ path: 'test-results/screenshots/same-word-player1.png', fullPage: true });
    await player2Page.screenshot({ path: 'test-results/screenshots/same-word-player2.png', fullPage: true });
  });

  test('Next Round button generates new public words and resets UI', async () => {
    console.log('Testing Next Round functionality...');
    
    // Setup: Create room, join, start game
    roomCode = await createPlayerAndRoom(player1Page, 'Alice');
    await joinRoom(player2Page, 'Bob', roomCode);
    await waitForPlayer(player1Page, 'Bob');
    
    const startButton = player1Page.locator('button:has-text("Start Game"), #start-game-btn');
    await startButton.click();
    
    await Promise.all([
      player1Page.waitForURL(/\/game\?code=/),
      player2Page.waitForURL(/\/game\?code=/)
    ]);
    
    console.log('Waiting for public words container...');
    await expect(player1Page.locator('#public-words-list')).toBeVisible({ timeout: 10000 });
    
    // Wait for public words to appear with longer timeout
    console.log('Waiting for clickable words...');
    await expect(player1Page.locator('.word-item.clickable').first()).toBeVisible({ timeout: 10000 });
    
    // Capture first round's words
    console.log('Capturing Round 1 words...');
    const round1Words = await player1Page.locator('.word-item.clickable').allTextContents();
    console.log('Round 1 words:', round1Words);
    
    // Player 1 selects first word
    console.log('Player 1 selecting word...');
    await player1Page.locator('.word-item.clickable').first().click();
    await player1Page.locator('#submit-choice-btn').click();
    
    // Player 2 selects different word
    console.log('Player 2 selecting word...');
    await player2Page.locator('.word-item.clickable').nth(1).click();
    await player2Page.locator('#submit-choice-btn').click();
    
    // Wait for reveal
    console.log('Waiting for reveal...');
    await player1Page.waitForTimeout(3000);
    await expect(player1Page.locator('text=Choices Revealed!')).toBeVisible({ timeout: 5000 });
    
    // Wait for Next Round button to appear
    console.log('Waiting for Next Round button...');
    const nextRoundButton = player1Page.locator('#next-round-btn, button:has-text("Next Round")');
    await expect(nextRoundButton).toBeVisible({ timeout: 5000 });
    
    // Take screenshot before clicking Next Round
    await player1Page.screenshot({ path: 'test-results/screenshots/next-round-before.png', fullPage: true });
    
    // Click Next Round
    console.log('Clicking Next Round...');
    await nextRoundButton.click();
    
    // Wait for reveal section to disappear (UI reset)
    await expect(player1Page.locator('text=Choices Revealed!')).not.toBeVisible({ timeout: 5000 });
    
    // Wait for new words to appear
    console.log('Waiting for new words...');
    await expect(player1Page.locator('.word-item.clickable').first()).toBeVisible({ timeout: 5000 });
    
    // Capture second round's words
    const round2Words = await player1Page.locator('.word-item.clickable').allTextContents();
    console.log('Round 2 words:', round2Words);
    
    // Verify words are different
    const wordsChanged = round1Words.some((word, index) => word !== round2Words[index]);
    expect(wordsChanged).toBe(true);
    console.log('✓ Public words changed after Next Round');
    
    // Verify submit button is reset (should be disabled until word is selected)
    const submitButton = player1Page.locator('#submit-choice-btn');
    await expect(submitButton).toBeDisabled();
    await expect(submitButton).toHaveText(/Submit Choice/);
    console.log('✓ Submit button reset to disabled state');
    
    // Select a word to verify button becomes enabled
    await player1Page.locator('.word-item.clickable').first().click();
    await expect(submitButton).toBeEnabled();
    console.log('✓ Submit button enables after word selection');
    
    // Verify scores are preserved
    const pointsDisplay = player1Page.locator('.score-item:has-text("Points:")');
    await expect(pointsDisplay).toContainText('1'); // Should still show point from round 1
    console.log('✓ Scores preserved across rounds');
    
    // Take screenshot after Next Round
    await player1Page.screenshot({ path: 'test-results/screenshots/next-round-after.png', fullPage: true });
    await player2Page.screenshot({ path: 'test-results/screenshots/next-round-player2.png', fullPage: true });
    
    console.log('✓ Next Round button works correctly');
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
