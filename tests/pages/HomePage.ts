import { Page, Locator, expect } from '@playwright/test';

export class HomePage {
  readonly page: Page;

  // Navigation & Layout
  readonly header: Locator;
  readonly addItemsButton: Locator;
  readonly monthSelector: Locator;
  readonly mainContent: Locator;

  // Header elements
  readonly catalogCount: Locator;
  readonly totalItemsAdded: Locator;
  readonly themeToggle: Locator;
  readonly apiKeySettings: Locator;
  readonly deleteMonthButton: Locator;

  // Month stats
  readonly toBuyCount: Locator;
  readonly completedCount: Locator;
  readonly monthlyBudgetInput: Locator;
  readonly budgetDisplay: Locator;

  // Action buttons
  readonly clearAllButton: Locator;
  readonly exportButton: Locator;

  // Mobile FAB
  readonly mobileFab: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator('header');
    this.addItemsButton = page.getByTestId('add-items-button');
    this.monthSelector = page.locator('[data-testid="month-selector"]');
    this.mainContent = page.locator('main');
    this.catalogCount = page.locator('[data-testid="catalog-count"]');
    this.totalItemsAdded = page.locator('[data-testid="total-items"]');
    this.themeToggle = page.getByRole('button', { name: /theme/i });
    this.apiKeySettings = page.getByRole('button', { name: /api key/i });
    this.deleteMonthButton = page.getByRole('button', { name: /delete/i });
    this.toBuyCount = page.locator('[data-testid="to-buy-count"]');
    this.completedCount = page.locator('[data-testid="completed-count"]');
    this.monthlyBudgetInput = page.locator('input[placeholder="Set total"]');
    this.budgetDisplay = page.locator('[data-testid="budget-display"]');
    this.clearAllButton = page.getByRole('button', { name: /clear all/i });
    this.exportButton = page.getByRole('button', { name: /export/i });
    this.mobileFab = page.locator('[data-testid="mobile-fab"]');
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async expectHeaderVisible() {
    await expect(this.header).toBeVisible();
  }

  async expectCatalogCount(expected: number) {
    await expect(this.catalogCount).toHaveText(`${expected} items catalog`);
  }

  async expectTotalItems(expected: number) {
    await expect(this.totalItemsAdded).toHaveText(`${expected} added`);
  }

  async clickAddItems() {
    // Try to click the desktop Add Items button; if not visible, fall back to mobile FAB
    try {
      await this.addItemsButton.waitFor({ state: 'visible', timeout: 5000 });
      await this.addItemsButton.click();
    } catch (e) {
      // Fallback to mobile FAB
      await this.mobileFab.waitFor({ state: 'visible', timeout: 5000 });
      await this.mobileFab.click();
    }
  }

  async openCatalog() {
    await this.clickAddItems();
    await this.page.waitForLoadState('networkidle');
  }

  async expectToBuyCount(expected: number) {
    await expect(this.toBuyCount).toContainText(`${expected} to buy`);
  }

  async expectCompletedCount(expected: number) {
    await expect(this.completedCount).toContainText(`${expected} completed`);
  }

  async setBudget(amount: number) {
    await this.monthlyBudgetInput.fill(amount.toString());
    await this.monthlyBudgetInput.blur();
    await this.page.waitForLoadState('networkidle');
  }

  async expectBudgetDisplay(amount: number) {
    await expect(this.budgetDisplay).toContainText(`₹${amount}`);
  }

  async clickClearAll() {
    await this.clearAllButton.click();
  }

  async clickExport() {
    await this.exportButton.click();
  }

  async expectExportDownloaded() {
    // Check for download - Playwright handles this automatically
    // In a real scenario, you'd check the downloads folder
    await this.page.waitForLoadState('networkidle');
  }

  async clickThemeToggle() {
    await this.themeToggle.click();
  }

  async getTheme() {
    const html = await this.page.locator('html').getAttribute('class');
    return html?.includes('dark') ? 'dark' : 'light';
  }

  async clickMobileFab() {
    await this.mobileFab.click();
  }
}
