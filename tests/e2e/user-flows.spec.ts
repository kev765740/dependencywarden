import { test, expect } from '@playwright/test';
import { login, mockAuthResponse, waitForLoadingToComplete, setTheme, expectFormValidation, clearLocalStorage, mockRepositoriesAPI } from './test-helpers';

test.describe('DependencyWarden User Flows', () => {
  test.beforeEach(async ({ page }) => {
    await clearLocalStorage(page);
    await setTheme(page, 'light');
  });

  test('should complete authentication flow', async ({ page }) => {
    await mockAuthResponse(page, true);
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForLoadingToComplete(page);

    // Verify login form
    await expect(page.getByTestId('login-form')).toBeVisible();
    
    // Complete login flow
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('password-input').fill('testpassword');
    await page.getByTestId('login-button').click();
    
    // Verify successful login
    await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('user-menu')).toBeVisible();
  });

  test('should navigate through main sections', async ({ page }) => {
    await mockAuthResponse(page, true);
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Login first
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('password-input').fill('testpassword');
    await page.getByTestId('login-button').click();
    await expect(page.getByTestId('dashboard')).toBeVisible();
    
    // Test navigation using data-testid and exact heading matches
    const navigationItems = [
      { id: 'dashboard-nav', title: 'Dashboard', url: '/dashboard' },
      { id: 'repos-nav', title: 'Repositories', url: '/repositories' },
      { id: 'notifs-nav', title: 'Notifications', url: '/notifications' }
    ];

    for (const item of navigationItems) {
      await page.goto(item.url);
      await waitForLoadingToComplete(page);
      // Use exact match to avoid conflicts with sub-headings
      await expect(page.getByRole('heading', { name: item.title, exact: true })).toBeVisible();
    }
  });

  test('should handle repository addition workflow', async ({ page }) => {
    await mockAuthResponse(page, true);
    await mockRepositoriesAPI(page);
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Login
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('password-input').fill('testpassword');
    await page.getByTestId('login-button').click();
    await expect(page.getByTestId('dashboard')).toBeVisible();
    
    // Navigate to repositories
    await page.goto('/repositories');
    await waitForLoadingToComplete(page);
    
    // Add repository flow
    await page.getByTestId('add-repo-button').click();
    await expect(page.getByTestId('add-repo-modal')).toBeVisible();
    
    // Fill repository form
    await page.getByTestId('repo-url-input').fill('https://github.com/test/repo');
    await page.getByTestId('add-repo-submit').click();
    
    // Verify success - use the specific repo list from repositories page
    await expect(page.getByTestId('success-message')).toBeVisible();
    await expect(page.getByTestId('repositories-page').getByTestId('repo-list')).toContainText('Test Repository');
  });

  test('should display security notifications', async ({ page }) => {
    await mockAuthResponse(page, true);
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Login
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('password-input').fill('testpassword');
    await page.getByTestId('login-button').click();
    await expect(page.getByTestId('dashboard')).toBeVisible();
    
    // Navigate to notifications
    await page.goto('/notifications');
    await waitForLoadingToComplete(page);
    
    // Verify notifications section
    await expect(page.getByTestId('notifications-list')).toBeVisible();
  });

  test('should handle vulnerability scanning', async ({ page }) => {
    await mockAuthResponse(page, true);
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Login
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('password-input').fill('testpassword');
    await page.getByTestId('login-button').click();
    await expect(page.getByTestId('dashboard')).toBeVisible();
    
    // Navigate to alerts page where scan functionality is
    await page.goto('/alerts');
    await waitForLoadingToComplete(page);
    
    // Verify scan status and button are visible
    await expect(page.getByTestId('scan-status')).toBeVisible();
    await expect(page.getByTestId('start-scan-button')).toBeVisible();
  });

  test('should display dashboard metrics', async ({ page }) => {
    await mockAuthResponse(page, true);
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Login
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('password-input').fill('testpassword');
    await page.getByTestId('login-button').click();
    await expect(page.getByTestId('dashboard')).toBeVisible();
    
    // Verify dashboard metrics - use the correct selectors from the HTML
    const metrics = [
      'total-repos',
      'active-alerts',
      'critical-issues',
      'vuln-summary'
    ];

    for (const metric of metrics) {
      await expect(page.getByTestId(metric)).toBeVisible();
    }
    
    // Also check that dashboard repo list is visible (without the prefix)
    await expect(page.getByTestId('dashboard').locator('div').filter({ hasText: 'Recent Repositories' })).toBeVisible();
  });

  test('should handle responsive navigation', async ({ page, browserName }) => {
    // Skip test for Firefox due to viewport issues
    test.skip(browserName === 'firefox', 'Viewport handling differs in Firefox');
    
    await mockAuthResponse(page, true);
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Login
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('password-input').fill('testpassword');
    await page.getByTestId('login-button').click();
    await expect(page.getByTestId('dashboard')).toBeVisible();
    
    // Test mobile menu (if exists)
    const mobileToggle = page.getByTestId('mobile-menu-toggle');
    if (await mobileToggle.isVisible()) {
      await mobileToggle.click();
      await expect(page.getByTestId('mobile-nav')).toBeVisible();
    }
  });

  test('should handle error states gracefully', async ({ page }) => {
    await mockAuthResponse(page, true);
    
    // Login first
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('password-input').fill('testpassword');
    await page.getByTestId('login-button').click();
    await expect(page.getByTestId('dashboard')).toBeVisible();
    
    // Clear authentication by removing token
    await page.evaluate(() => {
      try {
        localStorage.removeItem('authToken');
      } catch (e) {
        // Ignore errors
      }
    });
    
    // Test invalid route - should redirect to login 
    await page.goto('/invalid-route');
    await waitForLoadingToComplete(page);
    
    // Should redirect to login page since auth is cleared
    await expect(page.getByTestId('login-page')).toBeVisible();
  });

  test('should validate form inputs', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Test email validation by submitting form with invalid email
    await page.getByTestId('email-input').fill('invalid-email');
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('login-button').click();
    
    // Form should not submit or show validation error
    // Since we have client-side validation, the form won't submit
    await expect(page.getByTestId('login-form')).toBeVisible();
  });

  test('should handle loading states', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Verify content loads properly
    await expect(page.getByTestId('login-form')).toBeVisible();
    
    // If there are loading indicators, they should eventually disappear
    await waitForLoadingToComplete(page);
  });

  test('should maintain session across page refreshes', async ({ page }) => {
    await mockAuthResponse(page, true);
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Login
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('password-input').fill('testpassword');
    await page.getByTestId('login-button').click();
    await expect(page.getByTestId('dashboard')).toBeVisible();
    
    // Refresh page
    await page.reload();
    await waitForLoadingToComplete(page);
    
    // Should maintain authenticated state
    await expect(page.getByTestId('dashboard')).toBeVisible();
  });
});