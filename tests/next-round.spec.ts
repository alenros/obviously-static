import { test, expect, chromium, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { createPlayerAndRoom, joinRoom, cleanupRoom, waitForPlayer } from './helpers';

test.describe('Next Round Flow', () => {
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

  test.afterEach(async () => {
    if (roomCode) {
      await cleanupRoom(roomCode);
      roomCode = '';
    }
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test('Next round button appears after reveal, failed players see word replacement', async () => {
    console.log('Testing next round functionality...');
    
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
    
    // Wait for public words
    await expect(player1Page.locator('.word-item.clickable').first()).toBeVisible({ timeout: 5000 });
    
    // Both players select the SAME word (to trigger a foul)
    console.log('Both players selecting same word to trigger foul...');
    const word = player1Page.locator('.word-item.clickable').first();
    await word.click();
    await player1Page.locator('#submit-choice-btn').click();
    
    const word2 = player2Page.locator('.word-item.clickable').first();
    await word2.click();
    await player2Page.locator('#submit-choice-btn').click();
    
    // Wait for reveal
    await player1Page.waitForTimeout(3000);
    
    // Verify reveal appeared
    await expect(player1Page.locator('text=Choices Revealed!')).toBeVisible({ timeout: 5000 });
    
    // Verify Next Round button visible for host (Player 1)
    console.log('Checking for Next Round button (host)...');
    await expect(player1Page.locator('#next-round-btn')).toBeVisible();
    
    // Verify Player 2 sees "waiting for host" message
    console.log('Checking Player 2 sees waiting message...');
    await expect(player2Page.locator('text=Waiting for host to start next round')).toBeVisible();
    
    // Verify both failed players see word replacement UI
    console.log('Checking for word replacement UI...');
    await expect(player1Page.locator('#word-replacement-container')).toBeVisible();
    await expect(player2Page.locator('#word-replacement-container')).toBeVisible();
    
    // Verify they can see their words to replace
    await expect(player1Page.locator('.replacement-word')).toHaveCount(2);
    await expect(player2Page.locator('.replacement-word')).toHaveCount(2);
    
    console.log('✓ Next round UI displayed correctly');
    
    // Take screenshots
    await player1Page.screenshot({ path: 'test-results/screenshots/next-round-host.png', fullPage: true });
    await player2Page.screenshot({ path: 'test-results/screenshots/next-round-guest.png', fullPage: true });
    
    // Player 1 selects a word to replace
    console.log('Player 1 selecting word to replace...');
    await player1Page.locator('.replacement-word').first().click();
    await expect(player1Page.locator('.replacement-word.selected')).toBeVisible();
    
    // Player 2 selects a word to replace
    console.log('Player 2 selecting word to replace...');
    await player2Page.locator('.replacement-word').nth(1).click();
    await expect(player2Page.locator('.replacement-word.selected')).toBeVisible();
    
    // Store current public words to verify they change
    const firstRoundWords = await player1Page.locator('.word-item.clickable').allTextContents();
    console.log(`First round had ${firstRoundWords.length} words:`, firstRoundWords);
    
    // Set up navigation listener to detect unwanted page reloads
    let pageReloaded = false;
    player1Page.on('framenavigated', () => {
      pageReloaded = true;
    });
    
    // Host clicks Next Round
    console.log('Host starting next round...');
    await player1Page.locator('#next-round-btn').click();
    
    // Wait for round to reset
    await player1Page.waitForTimeout(2000);
    
    // VERIFY: No page reload occurred (smooth transition)
    expect(pageReloaded).toBe(false);
    console.log('✓ No page reload/flicker detected');
    
    // VERIFY: New public words appeared (choices cleared)
    await expect(player1Page.locator('#submit-choice-btn')).toBeVisible({ timeout: 5000 });
    await expect(player1Page.locator('#submit-choice-btn')).toContainText('Submit Choice');
    await expect(player1Page.locator('#submit-choice-btn')).toBeEnabled();
    
    // VERIFY: Correct number of public words (playerCount + 1 = 2 + 1 = 3)
    const newRoundWords = await player1Page.locator('.word-item.clickable').allTextContents();
    console.log(`Second round has ${newRoundWords.length} words:`, newRoundWords);
    expect(newRoundWords.length).toBe(3);
    console.log('✓ Correct number of public words (3 for 2 players)');
    
    // VERIFY: Words are different from first round (new words generated)
    const wordsChanged = newRoundWords.some(word => !firstRoundWords.includes(word));
    expect(wordsChanged).toBe(true);
    console.log('✓ New words generated for next round');
    
    // VERIFY: Player 2 also sees the new round
    await expect(player2Page.locator('.word-item.clickable').first()).toBeVisible({ timeout: 5000 });
    const player2NewWords = await player2Page.locator('.word-item.clickable').allTextContents();
    expect(player2NewWords.length).toBe(3);
    console.log('✓ Player 2 sees correct word count');
    
    console.log('✓ Next round started successfully without issues');
    
    // Take screenshots of new round
    await player1Page.screenshot({ path: 'test-results/screenshots/new-round-player1.png', fullPage: true });
    await player2Page.screenshot({ path: 'test-results/screenshots/new-round-player2.png', fullPage: true });
  });
});
