import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const key = "learning-graph.practice.v1";
const panel = (page: Page) => page.getByRole("region", { name: "A small place to start" });
async function start(page: Page, hours?: string) {
  if (hours) await page.getByLabel("How much time can you make each week?").fill(hours);
  await page.getByRole("button", { name: "Find my next step" }).click();
  await page.getByRole("button", { name: "Help me start" }).click();
}
test.beforeEach(async ({ page }) => { await page.goto("/", { waitUntil: "networkidle" }); });

test("starting support works without a timer or storage and never unlocks concepts", async ({ page }) => {
  await start(page);
  await expect(page.locator("#practice-heading")).toBeFocused();
  await expect(panel(page).getByRole("heading", { name: /Create a practice folder/ })).toBeVisible();
  await expect(panel(page).getByRole("timer")).toHaveText("No rush.");
  await expect(page.getByLabel("Keep my place on this device")).not.toBeChecked();
  await panel(page).getByText(/All practice steps/).click();
  for (const box of await panel(page).locator(".practice-checklist input").all()) await box.check();
  await expect(panel(page).getByText(/4 of 4 checked/)).toBeVisible();
  await expect(page.getByRole("list", { name: "Learning roadmap" }).getByRole("button", { name: /Text parsing/ })).toContainText("Needs prerequisites");
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBeNull();
  await page.reload({ waitUntil: "networkidle" });
  await expect(panel(page)).toHaveCount(0);
});

test("focus pause note reload and explicit resume preserve an opted-in place", async ({ page }) => {
  await page.clock.install();
  await start(page);
  await page.getByLabel("Keep my place on this device").check();
  await panel(page).getByRole("button", { name: "Focus view", exact: true }).click();
  await expect(page.locator(".workspace")).toBeHidden();
  await expect(page.locator("#full-roadmap")).toBeHidden();
  await expect(page.locator("#practice-heading")).toBeFocused();
  await page.getByRole("button", { name: "Start timer", exact: true }).click();
  await page.clock.runFor(60_000);
  await page.getByRole("button", { name: "Pause session", exact: true }).click();
  await page.getByLabel("When I return, my next action is…").fill("Compile sum.c and inspect the output");
  const time = await panel(page).getByRole("timer").textContent();
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).note, key)).toBe("Compile sum.c and inspect the output");
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByLabel("When I return, my next action is…")).toHaveValue("Compile sum.c and inspect the output");
  await expect(page.getByRole("button", { name: "Resume session", exact: true })).toBeVisible();
  await expect(panel(page).getByRole("timer")).toHaveText(time!);
  await page.getByRole("button", { name: "Resume session", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause session", exact: true })).toBeVisible();
  await page.getByLabel("Keep my place on this device").uncheck();
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBeNull();
  await page.reload({ waitUntil: "networkidle" });
  await expect(panel(page)).toHaveCount(0);
});

test("timer expiry invites a transition without moving or completing work", async ({ page }) => {
  await page.clock.install();
  await start(page, "0.01"); // 36 seconds, below every standard preset.
  await expect(page.getByLabel("Session length").locator("option")).toHaveCount(1);
  await expect(page.getByLabel("Session length")).toContainText("36 seconds");
  await page.getByRole("button", { name: "Start timer", exact: true }).click();
  await page.clock.runFor(36_250);
  await expect(page.getByRole("heading", { name: "A good moment to choose" })).toBeVisible();
  await expect(panel(page).getByRole("heading", { name: /Create a practice folder/ })).toBeVisible();
  await page.getByRole("button", { name: "Stay here", exact: true }).click();
  await expect(page.getByRole("heading", { name: "A good moment to choose" })).toHaveCount(0);
  await page.getByRole("button", { name: "Next small step", exact: true }).click();
  await expect(panel(page).getByRole("heading", { name: /Write down the two input integers/ })).toBeVisible();
  await page.getByRole("button", { name: "Take a break", exact: true }).click();
  await expect(page.getByRole("button", { name: "Next small step", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Resume session", exact: true }).click();
  await expect(page.getByRole("button", { name: "Next small step", exact: true })).toBeEnabled();
});

test("timer presets pause resume and stop are optional", async ({ page }) => {
  await start(page, "0.5");
  await expect(page.getByLabel("Session length").locator("option")).toHaveText(["5 minutes", "10 minutes", "20 minutes"]);
  await page.getByLabel("Session length").selectOption("5");
  await page.getByRole("button", { name: "Start timer", exact: true }).click();
  await page.getByRole("button", { name: "Pause timer", exact: true }).click();
  await expect(page.getByRole("button", { name: "Next small step", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Resume timer", exact: true }).click();
  await page.getByRole("button", { name: "Stop timer", exact: true }).click();
  await expect(panel(page).getByRole("timer")).toHaveText("No rush.");
});

test("profile changes pause a session and a different task requires explicit replacement", async ({ page }) => {
  await start(page);
  await page.getByLabel("When I return, my next action is…").fill("My C restart note");
  await page.getByRole("checkbox", { name: "C essentials", exact: true }).check();
  await expect(page.getByRole("button", { name: "Resume session", exact: true })).toBeDisabled();
  await expect(panel(page)).toContainText("Your profile changed");
  await page.getByRole("button", { name: "Restore session profile", exact: true }).click();
  await expect(page.getByRole("checkbox", { name: "C essentials", exact: true })).not.toBeChecked();
  await expect(page.getByLabel("When I return, my next action is…")).toHaveValue("My C restart note");
  await page.getByRole("checkbox", { name: "C essentials", exact: true }).check();
  await page.getByRole("button", { name: "Find my next step" }).click();
  await page.getByRole("button", { name: "Help me start" }).click();
  await expect(page.getByRole("button", { name: "Start this task instead" })).toBeVisible();
  await page.getByRole("button", { name: "Start this task instead" }).click();
  await expect(panel(page)).toContainText("Find the instructions in the noise");
  await expect(page.getByLabel("When I return, my next action is…")).toHaveValue("");
});

test("clear saved session removes stored data and restores focus", async ({ page }) => {
  await start(page);
  await page.getByLabel("Keep my place on this device").check();
  await expect.poll(() => page.evaluate((key) => Boolean(localStorage.getItem(key)), key)).toBe(true);
  await page.getByRole("button", { name: "Focus view", exact: true }).click();
  await page.getByRole("button", { name: "Clear saved session", exact: true }).click();
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBeNull();
  await expect(page.getByRole("button", { name: "Help me start" })).toBeFocused();
});

test("storage failure is disclosed while temporary practice continues", async ({ page }) => {
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException("Full", "QuotaExceededError"); }; });
  await start(page);
  await page.getByLabel("Keep my place on this device").check();
  await expect(panel(page).getByRole("status").filter({ hasText: /storage is unavailable/ })).toBeVisible();
  await page.getByRole("button", { name: "Next small step", exact: true }).click();
  await expect(panel(page).getByRole("heading", { name: /Write down the two input integers/ })).toBeVisible();
});

test("practice and saved notes work offline in an already loaded mobile page", async ({ page, context }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await context.setOffline(true);
  await start(page);
  await page.getByLabel("Keep my place on this device").check();
  await page.getByLabel("When I return, my next action is…").fill("Return to my scratch file");
  await page.getByRole("button", { name: "Focus view", exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Show roadmap", exact: true }).click();
  await expect(page.locator("#full-roadmap-heading")).toBeFocused();
  await expect(page.getByRole("list", { name: "Learning roadmap" }).getByRole("listitem")).toHaveCount(13);
});

test("keyboard focus restores after focus view and reaches selected roadmap details", async ({ page }) => {
  await start(page);
  const focusButton = page.getByRole("button", { name: "Focus view", exact: true });
  await focusButton.focus(); await page.keyboard.press("Enter");
  await expect(page.locator("#practice-heading")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Exit focus", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Help me start" })).toBeFocused();
  await page.getByRole("list", { name: "Learning roadmap" }).getByRole("button", { name: /Symbol tables/ }).click();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Read details for Symbol tables", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#selected-step-title")).toBeFocused();
  await page.getByRole("button", { name: "Read selected step details" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#selected-step-title")).toBeFocused();
  await expect(page.locator("#selected-step-title")).toHaveText("Symbol tables");
});

test("page and practice states have no detected WCAG A/AA axe violations", async ({ page }) => {
  const audit = async () => {
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations).toEqual([]);
  };
  await audit();
  await start(page); await panel(page).getByText(/All practice steps/).click(); await audit();
  await page.getByRole("button", { name: "Focus view", exact: true }).click(); await audit();
});

test("reflow at magnified viewport and forced colours preserves all controls", async ({ page }) => {
  // 1280px desktop at 400% browser zoom has a 320 CSS-pixel viewport.
  await page.setViewportSize({ width: 320, height: 720 });
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await start(page);
  await expect(page.getByRole("button", { name: "Next small step", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Show roadmap", exact: true }).click();
  await expect(page.getByRole("list", { name: "Learning roadmap" }).getByRole("listitem")).toHaveCount(13);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
