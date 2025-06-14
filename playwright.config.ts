import { PlaywrightTestConfig, devices } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './tests/e2e',
  timeout: 45000,
  expect: {
    timeout: 15000
  },
  fullyParallel: false, // Changed to false to avoid port conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Allow 1 retry even in dev
  workers: process.env.CI ? 1 : 1, // Use single worker to avoid conflicts
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    actionTimeout: 15000,
    baseURL: 'http://localhost:5000',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Add extra time for page loads
    navigationTimeout: 45000
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        // Firefox-specific settings
        launchOptions: {
          firefoxUserPrefs: {
            'dom.disable_beforeunload': true,
          },
        },
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        // WebKit-specific settings
        actionTimeout: 20000,
        navigationTimeout: 60000,
      },
    },
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
        actionTimeout: 20000,
        navigationTimeout: 60000,
      },
    },
  ],
  // Temporarily commented out to use manually started servers
  // webServer: [
  //   {
  //     command: 'npm run start',
  //     port: 3000,
  //     reuseExistingServer: !process.env.CI,
  //     timeout: 120000,
  //   },
  //   {
  //     command: 'cd client && npm run dev',
  //     port: 5000,
  //     reuseExistingServer: !process.env.CI,
  //     timeout: 120000,
  //   }
  // ],
}

export default config;