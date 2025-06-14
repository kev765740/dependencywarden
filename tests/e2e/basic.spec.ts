import { test, expect } from '@playwright/test';
import { login, mockAuthResponse, waitForLoadingToComplete, setTheme, clearLocalStorage, mockRepositoriesAPI } from './test-helpers';

test.describe('DependencyWarden Core Features', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage safely
    await clearLocalStorage(page);
    await setTheme(page, 'light');
  });

  test('should display the login page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForLoadingToComplete(page);

    // Check main elements with data-testid
    await expect(page.getByTestId('login-page')).toBeVisible();
    await expect(page.getByTestId('login-form')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();

    // Check form elements with data-testid
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('email-input')).toBeEnabled();
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeEnabled();
    await expect(page.getByTestId('login-button')).toBeVisible();
    await expect(page.getByTestId('login-button')).toBeEnabled();

    // Verify error message is hidden initially
    const errorElement = page.getByTestId('login-error');
    if (await errorElement.isVisible()) {
      await expect(errorElement).toBeHidden();
    }

    // Verify dashboard is not visible
    const dashboardElement = page.getByTestId('dashboard');
    if (await dashboardElement.isVisible()) {
      await expect(dashboardElement).toBeHidden();
    }
  });

  test('should handle authentication flow', async ({ page }) => {
    await mockAuthResponse(page, true);
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForLoadingToComplete(page);
    
    // Wait for login form to be visible
    await expect(page.getByTestId('login-form')).toBeVisible();
    
    // Fill login form using data-testid
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('password-input').fill('testpassword');
    await page.getByTestId('login-button').click();

    // Verify successful login - dashboard should be visible
    await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 10000 });
    
    // Login page should be hidden (navigation should have occurred)
    await expect(page.getByTestId('login-page')).toBeHidden();
    
    // User menu should be visible
    await expect(page.getByTestId('user-menu')).toBeVisible();
  });

  test('should manage repositories', async ({ page }) => {
    // Mock API responses
    await mockAuthResponse(page, true);
    await mockRepositoriesAPI(page);

    // Login first
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('password-input').fill('testpassword');
    await page.getByTestId('login-button').click();

    // Wait for dashboard
    await expect(page.getByTestId('dashboard')).toBeVisible();

    // Navigate to repositories page
    await page.getByTestId('repos-nav').click();
    await waitForLoadingToComplete(page);

    // Add repository using data-testid
    await page.getByTestId('add-repo-button').click();
    await expect(page.getByTestId('add-repo-modal')).toBeVisible();
    
    await page.getByTestId('repo-url-input').fill('https://github.com/test/repo');
    await page.getByTestId('add-repo-submit').click();

    // Verify repository added - use the specific repo list from repositories page
    await expect(page.getByTestId('success-message')).toBeVisible();
    await expect(page.getByTestId('repositories-page').getByTestId('repo-list')).toContainText('Test Repository');
  });

  test('should show security alerts', async ({ page }) => {
    await mockAuthResponse(page, true);
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Login
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('password-input').fill('testpassword');
    await page.getByTestId('login-button').click();
    await expect(page.getByTestId('dashboard')).toBeVisible();

    // Navigate to alerts using navigation or direct URL
    await page.goto('/alerts');
    await waitForLoadingToComplete(page);

    // Verify alerts section
    await expect(page.getByTestId('alerts-section')).toBeVisible();
    await expect(page.getByTestId('critical-alerts')).toBeVisible();
    await expect(page.getByTestId('high-alerts')).toBeVisible();
  });

  test('should handle error states', async ({ page }) => {
    // Mock failed login
    await mockAuthResponse(page, false);
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Try invalid login
    await page.getByTestId('email-input').fill('invalid@example.com');
    await page.getByTestId('password-input').fill('wrongpassword');
    await page.getByTestId('login-button').click();

    // Verify error message appears
    await expect(page.getByTestId('login-error')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('login-error')).toContainText('Invalid credentials');

    // Try accessing protected route without auth - should redirect to login
    await page.goto('/dashboard');
    await expect(page.getByTestId('login-page')).toBeVisible();
  });
}); 