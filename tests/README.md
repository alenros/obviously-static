# Integration Tests

This directory contains Playwright-based integration tests for the multiplayer Word Battle game.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Install Playwright browsers:
```bash
pnpm exec playwright install chromium
```

## Running Tests

### Run all tests (headless)
```bash
pnpm test
```

### Run with UI mode (interactive)
```bash
pnpm test:ui
```

### Run in debug mode
```bash
pnpm test:debug
```

### Run with browser visible
```bash
pnpm test:headed
```

## Test Structure

- **`multiplayer.spec.ts`** - Main two-player flow tests
  - Creating and joining rooms
  - Starting games
  - Player visibility
  - Host-only controls
  
- **`helpers.ts`** - Reusable test utilities
  - `createPlayerAndRoom()` - Create a new room as host
  - `joinRoom()` - Join existing room as guest
  - `cleanupRoom()` - Delete Firebase test data
  - `waitForPlayer()` - Wait for player to appear in list

## Test Scenarios

### ✅ Two-Player Room Flow
1. Player 1 creates room
2. Player 2 joins with room code
3. Both players see each other in lobby
4. Host starts game
5. Both redirect to game page

### ✅ Edge Cases
- Invalid room codes
- Empty player names
- Non-host trying to start game

## Firebase Cleanup

Tests automatically clean up created rooms after completion using `cleanupRoom()`. If tests fail mid-run, you may need to manually delete test rooms from Firebase.

## Notes

- Tests run serially to avoid Firebase race conditions
- Dev server automatically starts before tests (via `webServer` in config)
- Screenshots and videos saved on failure
- Retries once on failure
