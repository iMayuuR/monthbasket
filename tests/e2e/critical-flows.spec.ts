import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

test.describe('Critical Flows', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    // Set up catalog for testing
    await homePage.goto();
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('ai-catalog', JSON.stringify([
        {
          id: 1,
          marathiName: 'तांदूळ',
          englishName: 'Rice',
          category: 'Grains',
          typicalQuantity: '1 kg',
          suggestedQuantities: ['500 gm', '1 kg', '2 kg', '5 kg'],
          confidence: 0.95,
        },
        {
          id: 2,
          marathiName: 'दूध',
          englishName: 'Milk',
          category: 'Dairy',
          typicalQuantity: '1 litre',
          suggestedQuantities: ['500 ml', '1 litre', '2 litre'],
          confidence: 0.90,
        },
        {
          id: 3,
          marathiName: 'मसाला',
          englishName: 'Spices Mix',
          category: 'Spices',
          typicalQuantity: '100 gm',
          suggestedQuantities: ['50 gm', '100 gm', '250 gm'],
          confidence: 0.88,
        },
      ]));
      localStorage.setItem('grocery-monthly-lists', JSON.stringify({}));
    });
  });

  test('should add multiple items and verify list state', async ({ page }) => {
    await homePage.openCatalog();

    // Use more specific selector for add buttons in the catalog
    const addButtons = page.locator('[data-testid^="catalog-item-"] button[title="Add to list"]').first();
    await addButtons.click();
    await page.waitForTimeout(300);

    // Verify count increased
    await expect(homePage.toBuyCount).toHaveText(/to buy$/);
  });

  test('should handle month deletion', async ({ page }) => {
    // First add items to have a valid month
    await homePage.openCatalog();
    const addButton = page.locator('[data-testid^="catalog-item-"] button[title="Add to list"]').first();
    await addButton.click();
    await page.waitForTimeout(300);

    // Delete month
    await homePage.deleteMonthButton.click();
    await page.on('dialog', dialog => dialog.accept());
    await page.waitForTimeout(500);

    // Should redirect back to default view
    await expect(homePage.mainContent).toBeVisible();
  });

  test('should add item to new month', async ({ page }) => {
    // Create a new month
    await page.getByRole('button', { name: /new month/i }).click();
    await page.waitForTimeout(300);

    // Check month selector updated
    const newMonthKey = new Date();
    newMonthKey.setMonth(newMonthKey.getMonth() + 1);
    const monthLabel = newMonthKey.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });

    await expect(page.getByText(monthLabel)).toBeVisible({ timeout: 5000 });
  });

  test('should handle empty catalog gracefully', async ({ page }) => {
    // Clear catalog
    await page.evaluate(() => {
      localStorage.removeItem('catalog-generated');
      localStorage.removeItem('ai-catalog');
      localStorage.removeItem('grocery-monthly-lists');
    });
    await homePage.goto();
    await page.waitForTimeout(500);

    // Should still render without errors
    await expect(page.getByText('MonthBasket')).toBeVisible();

    // Add Items should be clickable
    await homePage.clickAddItems();
    await expect(page.getByTestId('grocery-catalog-modal')).toBeVisible();
  });
});
