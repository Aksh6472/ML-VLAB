import { test, expect } from '@playwright/test';

test.describe('Smoke Test', () => {
  test('should load application successfully and render visible content', async ({ page }) => {
    // 1. Opens http://localhost:5173
    const response = await page.goto('/');

    // 2. Verifies the page loads successfully
    expect(response?.status()).toBe(200);

    // 3. Verifies the application has visible content
    const heroHeading = page.getByRole('heading', { name: /Machine Learning Virtual Lab/i });
    await expect(heroHeading).toBeVisible();

    const exploreBtn = page.getByRole('link', { name: /Explore Experiments/i });
    await expect(exploreBtn).toBeVisible();
  });
});
