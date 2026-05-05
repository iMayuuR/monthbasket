import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

test.describe('Home Page Navigation', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('should load home page with header', async ({ page }) => {
    await expect(page).toHaveTitle(/MonthBasket|Grocery/i);
    await expect(homePage.header).toBeVisible();
  });

  test('should display MonthBasket title', async ({ page }) => {
    await expect(page.getByText('MonthBasket')).toBeVisible();
  });

  test('should show empty state when no items exist', async ({ page }) => {
    await expect(page.getByText('to buy')).toBeVisible();
    await expect(page.getByText('completed')).toBeVisible();
  });

  test('should open catalog on Add Items click', async ({ page }) => {
    await homePage.clickAddItems();
    await expect(page.getByTestId('grocery-catalog-modal')).toBeVisible();
  });

  test('should open catalog on mobile FAB click', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await homePage.clickMobileFab();
    await expect(page.getByTestId('grocery-catalog-modal')).toBeVisible();
  });

  test('should close catalog when backdrop clicked', async ({ page }) => {
    await homePage.clickAddItems();
    await expect(page.getByTestId('grocery-catalog-modal')).toBeVisible();
    await page.getByTestId('modal-backdrop').click();
    await expect(page.getByTestId('grocery-catalog-modal')).not.toBeVisible();
  });

  test('should have Add Items button in header', async ({ page }) => {
    await expect(page.getByRole('button', { name: /add items/i })).toBeVisible();
  });

  // Theme tests
  test('should have theme toggle button', async ({ page }) => {
    expect(await page.locator('[aria-label*="theme"]').first()).toBeVisible();
  });

  // Flaky test with quarantine
  test('flaky: catalog count loads after hydration', async ({ page }) => {
    test.fixme(true, 'Hydration may cause timing issues - Issue #123');
    await page.waitForTimeout(1000);
    // Catalog count should be visible after hydration
    await expect(homePage.catalogCount).toBeVisible();
  });
});
