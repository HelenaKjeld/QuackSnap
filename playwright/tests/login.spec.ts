import { test, expect } from "@playwright/test";

test("logs in and shows username on home and nav", async ({ page }) => {
  await page.goto("http://localhost:5173/");

  await page.getByTestId("nav-login").click();

  await expect(page).toHaveURL("http://localhost:5173/login");

  await page.getByTestId("login-email").fill("helenakjeld@gmail.com");
  await page.getByTestId("login-password").fill("123456");
  await page.getByTestId("login-submit").click();

  await expect(page).toHaveURL("http://localhost:5173/", { timeout: 10000 });

  const navUserBadge = page.getByTestId("nav-user-name");
  await expect(navUserBadge).toBeVisible();
  await expect(navUserBadge).toHaveText("Kjeldurin");

  const homeUserName = page.getByTestId("home-user-name");
  await expect(homeUserName).toBeVisible();
  await expect(homeUserName).toHaveText(/.+/);
});

// This test is to see if the login process works, and if the username is displayed
// on the home page and in the nav after login. It uses a test user that is seeded
// into the database with the seed script. The test will fail if the login process does not work,
// or if the username is not displayed on the home page or in the nav after login.

// Test works in friefox and in edge but not in chrome,
// maybe because of chromium tages longer to connect to the api.
// or because it is an localhost and not a real domain like Render.
