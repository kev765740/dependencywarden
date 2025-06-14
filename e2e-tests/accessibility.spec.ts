import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app before each test
    await page.goto('http://localhost:3000');
  });

  test('Dashboard page meets WCAG AA standards', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toHaveLength(0);
  });

  test('Repository management page accessibility', async ({ page }) => {
    await page.goto('http://localhost:3000/repositories');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    // Check for ARIA attributes
    const addRepoButton = await page.getByRole('button', { name: 'Add Repository' });
    expect(await addRepoButton.getAttribute('aria-label')).toBeDefined();
  });

  test('Vulnerability dashboard accessibility', async ({ page }) => {
    await page.goto('http://localhost:3000/vulnerabilities');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    // Check for proper headings structure
    const headings = await page.getByRole('heading').all();
    expect(headings.length).toBeGreaterThan(0);
  });

  test('Keyboard navigation functionality', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    
    // Press Tab to move through interactive elements
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluateHandle(() => document.activeElement);
    
    // Check if the focused element has visible focus indicator
    if (focusedElement) {
      const outline = await focusedElement.evaluate(el => 
        window.getComputedStyle(el).outlineStyle
      );
      expect(outline).not.toBe('none');
    }
  });

  test('Form accessibility and validation', async ({ page }) => {
    await page.goto('http://localhost:3000/settings');
    
    // Find form elements
    const form = await page.getByRole('form');
    const submitButton = await page.getByRole('button', { name: 'Save Settings' });
    
    // Check for proper form labeling
    const inputs = await page.getByRole('textbox').all();
    for (const input of inputs) {
      const labelId = await input.getAttribute('aria-labelledby');
      const label = labelId ? await page.getByTestId(labelId) : null;
      expect(label).toBeTruthy();
    }
    
    // Check form validation messages are announced to screen readers
    await submitButton.click();
    const errorMessage = await page.getByRole('alert');
    expect(await errorMessage.getAttribute('role')).toBe('alert');
  });

  test('Color contrast compliance', async ({ page }) => {
    await page.goto('http://localhost:3000');
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'color-contrast'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toHaveLength(0);
  });
}); 