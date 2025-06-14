import { Page, expect } from '@playwright/test';

// Auth helper functions
export async function login(page: Page, email = 'test@example.com', password = 'testpassword') {
  await page.goto('/', { waitUntil: 'networkidle' });
  
  // Wait for login form to be visible
  await expect(page.getByTestId('login-form')).toBeVisible();
  
  await page.getByTestId('email-input').fill(email);
  await page.getByTestId('password-input').fill(password);
  await page.getByTestId('login-button').click();
  
  // Wait for navigation to dashboard
  await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 10000 });
}

// Safe localStorage operations
export async function clearLocalStorage(page: Page) {
  try {
    await page.evaluate(() => {
      try {
        window.localStorage.clear();
      } catch (e) {
        // Ignore security errors in some browsers
      }
    });
  } catch (error) {
    // Ignore security errors - localStorage will be cleared on navigation
  }
}

// Theme helper functions
export async function setTheme(page: Page, theme: 'light' | 'dark') {
  try {
    await page.evaluate((themeName) => {
      try {
        localStorage.setItem('theme', themeName);
      } catch (e) {
        // Ignore security errors
      }
    }, theme);
  } catch (error) {
    // Ignore security errors
  }
}

// Wait helper functions
export async function waitForLoadingToComplete(page: Page) {
  try {
    // Wait for any loading indicators to disappear
    await page.waitForSelector('[data-testid="loading"]', { state: 'hidden', timeout: 5000 });
  } catch (error) {
    // Loading indicator might not exist, continue
  }
}

// Network interception helpers
export async function mockAuthResponse(page: Page, success = true) {
  await page.route('**/api/auth/login', async (route) => {
    if (success) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, token: 'test-token' })
      });
    } else {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Invalid credentials' })
      });
    }
  });
}

export async function mockRepositoriesAPI(page: Page) {
  await page.route('**/api/repositories', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 1,
          name: 'Test Repository',
          url: 'https://github.com/test/repo',
          lastScanned: new Date().toISOString(),
          alerts: 5
        }])
      });
    } else if (method === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Repository added successfully'
        })
      });
    }
  });
}

// Browser detection helper
export function getBrowserName(userAgent: string) {
  if (userAgent.includes('Firefox')) return 'firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'webkit';
  return 'chromium';
}

// Form validation helper
export async function expectFormValidation(page: Page, selector: string, errorMessage: string) {
  const input = page.getByTestId(selector);
  await input.fill('invalid-input');
  await input.blur();
  
  // Look for validation error
  try {
    await expect(page.getByText(errorMessage)).toBeVisible({ timeout: 3000 });
  } catch (error) {
    // If exact message not found, look for any validation error
    await expect(page.locator('.error, [role="alert"], .field-error')).toBeVisible({ timeout: 3000 });
  }
} 