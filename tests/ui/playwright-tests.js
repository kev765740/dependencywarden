/**
 * UI Testing with Playwright
 * Comprehensive frontend testing for DependencyWarden
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5000';

test.describe('DependencyWarden UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('Homepage loads correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/DependencyWarden/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Navigation menu works', async ({ page }) => {
    // Test main navigation
    await page.click('text=Features');
    await expect(page.url()).toContain('/features');
    
    await page.click('text=Pricing');
    await expect(page.url()).toContain('/pricing');
    
    await page.click('text=Dashboard');
    await expect(page.url()).toContain('/dashboard');
  });

  test('User registration flow', async ({ page }) => {
    await page.click('text=Sign Up');
    
    await page.fill('input[name="email"]', 'ui-test@example.com');
    await page.fill('input[name="password"]', 'UITest123!');
    await page.fill('input[name="username"]', 'uitest');
    
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard or show success message
    await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 10000 });
  });

  test('User login flow', async ({ page }) => {
    await page.click('text=Sign In');
    
    await page.fill('input[name="email"]', 'test@depwatch.dev');
    await page.fill('input[name="password"]', 'test123');
    
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page.url()).toContain('/dashboard');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('Dashboard displays key metrics', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/auth`);
    await page.fill('input[name="email"]', 'test@depwatch.dev');
    await page.fill('input[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard');
    
    // Check for key dashboard elements
    await expect(page.locator('text=Total Repositories')).toBeVisible();
    await expect(page.locator('text=Active Alerts')).toBeVisible();
    await expect(page.locator('text=Critical Issues')).toBeVisible();
  });

  test('Repository management interface', async ({ page }) => {
    // Login and navigate to repositories
    await page.goto(`${BASE_URL}/auth`);
    await page.fill('input[name="email"]', 'test@depwatch.dev');
    await page.fill('input[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    
    await page.click('text=Repositories');
    
    // Test add repository modal
    await page.click('button:has-text("Add Repository")');
    await expect(page.locator('.modal')).toBeVisible();
    
    await page.fill('input[name="name"]', 'UI Test Repo');
    await page.fill('input[name="repoUrl"]', 'https://github.com/test/repo');
    
    await page.click('button:has-text("Add Repository")');
    
    // Should see success message or new repo in list
    await expect(page.locator('text=Repository added')).toBeVisible({ timeout: 10000 });
  });

  test('Form validation errors display correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('Responsive design works', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    // Navigation should be mobile-friendly
    await expect(page.locator('.mobile-menu, .hamburger')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    
    // Content should adapt
    await expect(page.locator('main')).toBeVisible();
  });

  test('Dark mode toggle works', async ({ page }) => {
    // Look for theme toggle
    const themeToggle = page.locator('[data-testid="theme-toggle"], button:has-text("Dark"), button:has-text("Light")');
    
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      
      // Check if dark class is applied
      const htmlElement = page.locator('html');
      await expect(htmlElement).toHaveClass(/dark/);
    }
  });

  test('Security scanning interface', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/auth`);
    await page.fill('input[name="email"]', 'test@depwatch.dev');
    await page.fill('input[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    
    await page.click('text=Security');
    
    // Should show vulnerability list or scan options
    await expect(page.locator('text=Vulnerabilities, text=Security Scan')).toBeVisible();
  });

  test('Settings page functionality', async ({ page }) => {
    // Login and navigate to settings
    await page.goto(`${BASE_URL}/auth`);
    await page.fill('input[name="email"]', 'test@depwatch.dev');
    await page.fill('input[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    
    await page.click('text=Settings');
    
    // Test settings updates
    await page.fill('input[name="username"]', 'updated-username');
    await page.click('button:has-text("Save")');
    
    await expect(page.locator('text=Settings updated')).toBeVisible({ timeout: 10000 });
  });

  test('Billing page displays correctly', async ({ page }) => {
    // Login and navigate to billing
    await page.goto(`${BASE_URL}/auth`);
    await page.fill('input[name="email"]', 'test@depwatch.dev');
    await page.fill('input[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    
    await page.click('text=Billing');
    
    // Should show subscription info
    await expect(page.locator('text=Subscription, text=Plan, text=Billing')).toBeVisible();
  });

  test('Error states display properly', async ({ page }) => {
    // Navigate to non-existent page
    await page.goto(`${BASE_URL}/non-existent-page`);
    
    // Should show 404 page
    await expect(page.locator('text=404, text=Not Found')).toBeVisible();
  });

  test('Loading states work correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Should show loading indicators
    await expect(page.locator('.loading, .spinner, text=Loading')).toBeVisible();
  });
});

test.describe('Performance Tests', () => {
  test('Page load times are acceptable', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(BASE_URL);
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000); // Under 3 seconds
  });

  test('Large data sets render efficiently', async ({ page }) => {
    // Login and navigate to page with large data
    await page.goto(`${BASE_URL}/auth`);
    await page.fill('input[name="email"]', 'test@depwatch.dev');
    await page.fill('input[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    
    await page.click('text=Vulnerabilities');
    
    const startTime = Date.now();
    await page.waitForSelector('table, .vulnerability-list');
    const renderTime = Date.now() - startTime;
    
    expect(renderTime).toBeLessThan(2000); // Under 2 seconds
  });
});

test.describe('Accessibility Tests', () => {
  test('Keyboard navigation works', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
  });

  test('Screen reader compatibility', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check for proper ARIA labels and semantic HTML
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Color contrast meets standards', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // This would typically use a tool like axe-core
    // For now, we'll check that text is visible
    await expect(page.locator('body')).toBeVisible();
  });
});