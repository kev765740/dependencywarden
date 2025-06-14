import { test, expect } from '@playwright/test';

test.describe('Beta User Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('DevSecOps Engineer: Complete repository setup workflow', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/auth');
    await page.fill('input[name="email"]', 'devsecops@example.com');
    await page.fill('input[name="password"]', 'securepass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Add repository
    await page.click('text=Add Repository');
    await page.fill('input[name="repoUrl"]', 'https://github.com/example/test-repo');
    await page.click('button:has-text("Add")');

    // Verify repository added
    await expect(page.locator('text=test-repo')).toBeVisible();
    
    // Configure scanning
    await page.click('text=Configure Scanning');
    await page.check('input[name="enableDailyScans"]');
    await page.click('button:has-text("Save")');

    // Verify configuration saved
    await expect(page.locator('text=Configuration saved')).toBeVisible();
  });

  test('Security Engineer: Vulnerability assessment workflow', async ({ page }) => {
    await page.goto('http://localhost:3000/auth');
    await page.fill('input[name="email"]', 'security@example.com');
    await page.fill('input[name="password"]', 'securepass123');
    await page.click('button[type="submit"]');

    // Navigate to vulnerabilities
    await page.click('text=Vulnerabilities');
    
    // Filter vulnerabilities
    await page.selectOption('select[name="severity"]', 'high');
    await page.click('button:has-text("Apply")');

    // Verify filtered results
    await expect(page.locator('text=High Severity')).toBeVisible();
    
    // Export report
    await page.click('button:has-text("Export Report")');
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('vulnerability-report');
  });

  test('CTO: Team setup and role management', async ({ page }) => {
    await page.goto('http://localhost:3000/auth');
    await page.fill('input[name="email"]', 'cto@example.com');
    await page.fill('input[name="password"]', 'securepass123');
    await page.click('button[type="submit"]');

    // Navigate to team management
    await page.click('text=Team Management');
    
    // Add team member
    await page.click('button:has-text("Add Member")');
    await page.fill('input[name="email"]', 'newdev@example.com');
    await page.selectOption('select[name="role"]', 'developer');
    await page.click('button:has-text("Send Invite")');

    // Verify member added
    await expect(page.locator('text=newdev@example.com')).toBeVisible();
  });
}); 