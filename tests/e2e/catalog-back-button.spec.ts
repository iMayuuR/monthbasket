import { test, expect } from '@playwright/test';

// Test that the back button appears in the catalog modal and navigates back

test.describe('Catalog back button', () => {
  test('should be visible and close the catalog modal', async ({ page }) => {
    // Open the app
    await page.goto('/');
    // Open the catalog modal via the Add Items button
    await page.getByTestId('add-items-button').click();
    // Ensure the modal is open
    await expect(page.getByTestId('catalog-header')).toBeVisible();
    // Verify the back button exists
    const backButton = page.getByTestId('catalog-back-button');
    await expect(backButton).toBeVisible();
    // Click the back button
    await backButton.click();
    // The modal should be closed
    await expect(page.getByTestId('catalog-header')).not.toBeVisible();
  });
});
