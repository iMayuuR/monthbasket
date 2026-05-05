// E2E tests for MonthBasket header visibility and theme contrast
import { test, expect } from '@playwright/test';

// Helper to check header visibility and basic contrast class
async function checkHeader(page) {
  const header = page.locator('[data-testid="header"] h1');
  await expect(header).toBeVisible();
  await expect(header).toContainText('MonthBasket');
  // Ensure the drop‑shadow class is present for contrast
  const classList = await header.getAttribute('class');
  expect(classList).toContain('drop-shadow-md');
}

test.describe('MonthBasket header', () => {
  test('is visible and styled in light mode', async ({ page }) => {
    await page.goto('/');
    await checkHeader(page);
  });

  test('remains visible and styled after switching to dark mode', async ({ page }) => {
    await page.goto('/');
    // Click the ThemeToggle button (has aria-label="theme toggle")
    await page.getByLabel('theme toggle').click();
    // Wait for dark mode transition
    await page.waitForTimeout(500);
    await checkHeader(page);
  });
});
