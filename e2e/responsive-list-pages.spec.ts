import { test, expect } from "@playwright/test";
import { LIST_PAGES, MOBILE, DESKTOP } from "./fixtures";

// Regression guard for Task: "Confirm list pages never scroll sideways on phones".
// Each list page must render stacked cards (no horizontal page scroll) below the
// `lg` breakpoint and the wide table at desktop widths.
test.describe("list pages responsive layout", () => {
  for (const p of LIST_PAGES) {
    test(`${p.path}: stacked cards, no sideways scroll at 375px`, async ({ page }) => {
      await page.setViewportSize(MOBILE);
      await page.goto(p.path);

      const card = page.locator(`[data-testid^="${p.card}-"]`).first();
      await expect(card).toBeVisible();

      const row = page.locator(`[data-testid^="${p.row}-"]`).first();
      await expect(row).toBeHidden();

      // clientWidth excludes the vertical scrollbar gutter, so this is a
      // scrollbar-safe check for genuine horizontal overflow.
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow, `horizontal overflow on ${p.path}`).toBeLessThanOrEqual(1);
    });

    test(`${p.path}: table shown, cards hidden at 1280px`, async ({ page }) => {
      await page.setViewportSize(DESKTOP);
      await page.goto(p.path);

      const row = page.locator(`[data-testid^="${p.row}-"]`).first();
      await expect(row).toBeVisible();

      const card = page.locator(`[data-testid^="${p.card}-"]`).first();
      await expect(card).toBeHidden();
    });
  }
});
