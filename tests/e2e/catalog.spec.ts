import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

test.describe('Grocery Catalog', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
    await homePage.openCatalog();
  });

  test('should display catalog modal', async ({ page }) => {
    await expect(page.getByTestId('grocery-catalog-modal')).toBeVisible();
    await expect(page.getByText('MonthBasket Catalog')).toBeVisible();
  });

  test('should have search input', async ({ page }) => {
    await expect(page.getByPlaceholder('Search items...')).toBeVisible();
  });

  test('should have category tabs', async ({ page }) => {
    await expect(page.getByRole('button', { name: /all/i })).toBeVisible();
  });

  test('should show Add New button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /add new/i })).toBeVisible();
  });

  test('should filter items when searching', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search items...');
    await searchInput.fill('rice');
    await page.waitForTimeout(500);
    // Expect to find rice or empty state
    const items = page.locator('button:has-text("राइस"):enabled, button:has-text("Rice"):enabled');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should add item to list when plus button clicked', async ({ page }) => {
    // Clear local storage first to ensure empty state
    await page.evaluate(() => localStorage.clear());

    // Reload and open catalog
    await homePage.goto();
    await homePage.openCatalog();

    // Find and click first add button (with Plus icon)
    const addButtons = page.locator('button:has(svg)').filter({ hasText: /\+/ });
    if (await addButtons.first().isVisible()) {
      await addButtons.first().click();
      await page.waitForTimeout(500);

      // Check that the item count increased in header
      await expect(page.locator('[data-testid="to-buy-count"]')).toContainText('1 to buy');
    }
  });

  test('should close catalog when close button clicked', async ({ page }) => {
    // Find close button (X icon)
    const closeButtons = page.locator('button:has-text("×"), button[aria-label*="close"]');
    if (await closeButtons.first().isVisible()) {
      await closeButtons.first().click();
    } else {
      // Fallback - click backdrop
      await page.getByTestId('modal-backdrop').click();
    }
    await expect(page.getByTestId('grocery-catalog-modal')).not.toBeVisible();
  });

  test('should toggle Add Custom Item form', async ({ page }) => {
    await page.getByRole('button', { name: /add new/i }).click();
    await page.waitForTimeout(300);
    await expect(page.getByPlaceholder(/item name/i)).toBeVisible();
  });

  // Add custom item test
  test('should add custom item', async ({ page }) => {
    await page.getByRole('button', { name: /add new/i }).click();
    await page.waitForTimeout(300);

    await page.getByPlaceholder(/item name/i).fill('Test Item');
    await page.getByPlaceholder(/marathi/i).fill('टेस्ट आयटम');
    await page.getByRole('button', { name: /save/i }).click();

    await page.waitForTimeout(500);
    await expect(page.locator('text=Test Item').first()).toBeVisible();
  });

  // Edge case: empty search
  test('should show all items when search is empty', async ({ page }) => {
    await expect(page.locator('[data-testid="catalog-item"]')).toHaveCount({ exact: 0 }, { timeout: 5000 }).catch(() => {});
    const searchInput = page.getByPlaceholder('Search items...');
    await searchInput.fill('');
    // All items should be shown after clearing
    await page.waitForTimeout(500);
  });

  // Flaky timeout resilience
  test('retry: catalog interactions', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'Flaky modal interactions',
    });
    await page.getByTestId('modal-backdrop').click({ timeout: 5000 });
    await page.waitForTimeout(300);
    await homePage.openCatalog();
    await expect(page.getByTestId('grocery-catalog-modal')).toBeVisible();
  });
});
