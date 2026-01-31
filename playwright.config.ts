import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load environment variables for tests
dotenv.config();

/**
 * Playwright configuration for obviously-static multiplayer tests
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Run serially to avoid Firebase conflicts
  timeout: 30000,
  retries: 1,
  
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
    screenshot: process.env.SCREENSHOTS ? 'on' : 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  webServer: {
    command: 'pnpm dev --host',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
