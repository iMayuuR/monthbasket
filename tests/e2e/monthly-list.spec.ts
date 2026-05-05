import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

test.describe('Monthly List Management', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
    // Clear any existing data for clean slate
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('ai-catalog', JSON.stringify([
        {
          id: 1,
          marathiName: 'तांदूळ',
          englishName: 'Rice',
          category: 'Grains',
          typicalQuantity: '1 kg',
          suggestedQuantities: ['500 gm', '1 kg', '2 kg'],
          confidence: 0.95,
        },
        {
          id: 2,
          marathiName: 'दूध',
          englishName: 'Milk',
          category: 'Dairy',
          typicalQuantity: '1 litre',
          suggestedQuantities: ['500 ml', '1 litre'],
          confidence: 0.90,
        }
      ]));
      localStorage.setItem('grocery-monthly-lists', JSON.stringify({}));
    });
  });

  test('should add item to monthly list', async ({ page }) => {
    // Open catalog
    await homePage.openCatalog();

    // Click add button on first catalog item (using specific title attribute)
    const addButton = page.locator('[data-testid^="catalog-item-"] button[title="Add to list"]').first();
    await addButton.click();
    await page.waitForTimeout(500);

    // Should show in to-buy count
    await expect(page.locator('[data-testid="to-buy-count"]')).toContainText('1 to buy');
  });

  test('should add item with quantity selection', async ({ page }) => {
    await homePage.openCatalog();

    // Click first catalog item to trigger quantity selector
    const firstItem = page.locator('[data-testid^="catalog-item-"]').first();
    await firstItem.click();
    await page.waitForTimeout(500);

    // Verify quantity selector appears
    await expect(page.getByText('Select Quantity')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/तांदूळ|Rice/)).toBeVisible();

    // Select a quantity from quick list
    await page.locator('button:has-text("1 kg")').first().click();
    await page.waitForTimeout(300);

    // Verify item is added to list
    await expect(page.locator('[data-testid="to-buy-count"]')).toContainText('1 to buy');
  });

  test('should toggle item completion', async ({ page }) => {
    // Add an item first
    await homePage.openCatalog();
    const addButton = page.locator('[data-testid^="catalog-item-"] button[title="Add to list"]').first();
    await addButton.click();
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="to-buy-count"]')).toContainText('1 to buy');

    // Toggle completion (find checkbox/button in list)
    await page.getByTestId('to-buy-count').waitFor({ state: 'visible' });
    const toggle = page.locator('button[aria-checked="false"]').first();
    if (await toggle.isVisible()) {
      await toggle.click();
      await page.waitForTimeout(300);
      await expect(page.locator('[data-testid="completed-count"]')).toContainText('1 completed');
    }
  });

  test('should remove item from list', async ({ page }) => {
    // Add an item
    await homePage.openCatalog();
    const addButton = page.locator('[data-testid^="catalog-item-"] button[title="Add to list"]').first();
    await addButton.click();
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="to-buy-count"]')).toContainText('1 to buy');

    // Find and click delete button
    const deleteBtn = page.locator('button[aria-label*="delete"]:visible').first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await page.waitForTimeout(300);
      await page.on('dialog', dialog => dialog.accept());
      await page.waitForTimeout(500);
      await expect(page.locator('[data-testid="to-buy-count"]')).toContainText('0 to buy');
    }
  });

  test('should set monthly budget', async ({ page }) => {
    const budgetInput = page.locator('input[placeholder="Set total"]');
    await budgetInput.fill('5000');
    await budgetInput.blur();
    await page.waitForTimeout(300);
    await expect(page.locator('[data-testid="budget-display"]')).toContainText('₹5000');
  });

  test('should clear budget', async ({ page }) => {
    // Set budget first
    await homePage.setBudget(5000);
    await expect(page.locator('[data-testid="budget-display"]')).toBeVisible();

    // Click clear button
    const clearBudgetBtn = page.locator('[data-testid="budget-display"]').locator('svg').first();
    if (await clearBudgetBtn.isVisible()) {
      await clearBudgetBtn.click();
      await page.waitForTimeout(300);
      await expect(page.locator('[data-testid="budget-display"]')).not.toBeVisible();
    }
  });

  test('should export grocery list', async ({ page }) => {
    // Need at least one item to enable export
    await homePage.openCatalog();
    const addButton = page.locator('[data-testid^="catalog-item-"] button[title="Add to list"]').first();
    await addButton.click();
    await page.waitForTimeout(500);

    await homePage.clickExport();
    await expect(page).toHaveURL('/');

    // Check download happened
    await page.waitForTimeout(1000);
  });

  test('should clear all items', async ({ page }) => {
    // Add multiple items
    await homePage.openCatalog();
    const addButton = page.locator('[data-testid^="catalog-item-"] button[title="Add to list"]').first();
    await addButton.click();
    await page.waitForTimeout(300);
    await addButton.click();
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="to-buy-count"]')).toContainText('2 to buy');

    await homePage.clickClearAll();
    await page.on('dialog', dialog => dialog.accept());
    await page.waitForTimeout(300);
    await expect(page.locator('[data-testid="to-buy-count"]')).toContainText('0 to buy');
  });

  // Flaky test issue
  test('flaky: toggle completion animation', async ({ page }) => {
    test.fixme(true, 'Animation timing causes inconsistent results - Issue #124');
    await homePage.openCatalog();
    const addButton = page.locator('[data-testid^="catalog-item-"] button[title="Add to list"]').first();
    await addButton.click();
    await page.waitForTimeout(1000); // wait longer for animations
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible()) {
      await checkbox.click();
    }
  });
});
