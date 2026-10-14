import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => { await page.goto("/", { waitUntil: "networkidle" }); });

test("theme follows the system until a remembered choice overrides it", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByLabel("Color theme").selectOption("light");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByLabel("Color theme")).toHaveValue("light");
  await page.getByLabel("Color theme").selectOption("system");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("theme controls remain usable when storage is unavailable", async ({ page }) => {
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException("Blocked"); }; });
  await page.getByLabel("Color theme").selectOption("dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("status").filter({ hasText: /could not remember/ })).toHaveText(/Theme changed for this page/);
});

test("dark mode preserves accessible planning, focus view, and mobile layout", async ({ page }) => {
  await page.getByLabel("Color theme").selectOption("dark");
  await page.getByRole("button", { name: "Find my next step" }).click();
  await page.getByRole("button", { name: "Help me start" }).click();
  let audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(audit.violations).toEqual([]);
  await page.getByRole("button", { name: "Focus view", exact: true }).click();
  await page.setViewportSize({ width: 320, height: 720 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(audit.violations).toEqual([]);
});

test("guests can use the planner and protected account access redirects", async ({ page }) => {
  await page.getByRole("button", { name: "Find my next step" }).click();
  await expect(page.getByTestId("generated-plan")).toBeVisible();
  await page.goto("/account");
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.getByRole("link", { name: "Continue as a guest" }).click();
  await expect(page.getByRole("button", { name: "Find my next step" })).toBeVisible();
});

test("seeded SQLite sign-in persists a verified HttpOnly session and signs out", async ({ page, context }) => {
  const password = process.env.DEMO_SEED_PASSWORD;
  if (!password) throw new Error("Run npm run db:seed before auth browser checks.");
  await page.getByRole("link", { name: "Sign in", exact: true }).click();
  await page.getByLabel("Email", { exact: true }).fill("ada@example.test");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole("heading", { name: "Welcome, Ada." })).toBeVisible();
  const session = (await context.cookies()).find((cookie) => cookie.name === "learning-session")!;
  expect(session.httpOnly).toBe(true); expect(session.sameSite).toBe("Strict");
  expect(await page.evaluate(() => document.cookie.includes("learning-session"))).toBe(false);
  const response = await page.request.get("/api/auth/session");
  expect(await response.json()).toEqual({ user: { id: "ada-demo", email: "ada@example.test", name: "Ada" } });
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Welcome, Ada." })).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL("/");
  await page.goto("/account"); await expect(page).toHaveURL(/\/sign-in$/);
});

test("wrong credentials show an accessible error without issuing a session", async ({ page, context }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email", { exact: true }).fill("ada@example.test");
  await page.getByLabel("Password", { exact: true }).fill("incorrect-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: /Email or password/ })).toBeVisible();
  expect((await context.cookies()).some((cookie) => cookie.name.includes("learning-session"))).toBe(false);
  await page.getByLabel("Color theme").selectOption("dark");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations).toEqual([]);
});

test("auth actions reject cross-origin requests and forged cookies", async ({ page, context }) => {
  const attack = await page.request.post("/api/auth/login", { headers: { Origin: "https://attacker.invalid", "x-learning-graph-action": "auth" }, data: { email: "ada@example.test", password: "anything" } });
  expect(attack.status()).toBe(403);
  const logout = await page.request.post("/api/auth/logout", { headers: { Origin: "https://attacker.invalid", "x-learning-graph-action": "auth" } });
  expect(logout.status()).toBe(403);
  await context.addCookies([{ name: "learning-session", value: "forged.payload.signature", url: "http://127.0.0.1:3100" }]);
  await page.goto("/account"); await expect(page).toHaveURL(/\/sign-in$/);
  expect(await (await page.request.get("/api/auth/session")).json()).toEqual({ user: null });
  expect((await page.request.get("/data/users.sqlite")).status()).toBe(404);
});
