import { test, expect } from "@playwright/test";

test("home page loads", async ({ page }) => {
  await page.goto("http://localhost:5173/");

  await expect(page.getByTestId("nav")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Only the Finest Quacks" }),
  ).toBeVisible();
});
