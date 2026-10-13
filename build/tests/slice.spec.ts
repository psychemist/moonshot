import { expect, test, type Page } from "@playwright/test";

const button = (page: Page) => page.getByRole("button", { name: "Find my next step" });
const hours = (page: Page) => page.getByLabel("How much time can you make each week?");
const goal = (page: Page) => page.getByLabel("What do you want to build?");

test.beforeEach(async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
});

test("a judge generates a roadmap and inspects a complete task", async ({ page }, testInfo) => {
  await expect(page.getByTestId("generated-plan")).toHaveCount(0);
  await expect(page.getByRole("checkbox", { name: "Python", exact: true })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "JavaScript", exact: true })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Basic calculus", exact: true })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "C essentials", exact: true })).not.toBeChecked();
  await button(page).click();
  await expect(page.getByRole("heading", { name: "Make your first C program run" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Learning roadmap" }).getByRole("listitem")).toHaveCount(13);
  await expect(page.getByText("60 min · provisional")).toBeVisible();
  await expect(page.getByText("What you should have at the end")).toBeVisible();
  await expect(page.getByText("Why this step?", { exact: true })).toBeVisible();
  await expect(page.getByTestId("generated-plan").getByText(/Your program compiles successfully and prints 5/)).toBeVisible();
  await expect(page.getByText("60 minutes", { exact: true })).toBeVisible();
  await expect(page.getByTestId("generated-plan").getByRole("link", { name: /GNU C Language/ })).toHaveAttribute("href", /www.gnu.org/);
  await expect(page.getByText(/External resource · Internet required/)).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("desktop.png"), fullPage: true });
});

test("prior C knowledge changes the recommendation and clears stale results", async ({ page }) => {
  await button(page).click();
  await page.getByRole("checkbox", { name: "C essentials", exact: true }).check();
  await expect(page.getByTestId("generated-plan")).toHaveCount(0);
  await button(page).click();
  await expect(page.getByRole("heading", { name: "Find the instructions in the noise" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Learning roadmap" }).getByText(/Familiar · self-reported/)).toBeVisible();
  await expect(page.getByText(/You marked C essentials as prior knowledge/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Project 6: The Assembler/ })).toHaveAttribute("href", "https://www.nand2tetris.org/project06");
});

test("a small budget keeps the first task realistic", async ({ page }) => {
  await hours(page).fill("0.5");
  await button(page).click();
  await expect(page.getByText("30 minutes", { exact: true })).toBeVisible();
  await expect(page.getByText(/30 minutes remain\. Continue the rest in a later week/)).toBeVisible();
});

test("unsupported goals have an explicit recovery without substitution", async ({ page }) => {
  await button(page).click();
  await goal(page).fill("learn robotics");
  await expect(page.getByTestId("generated-plan")).toHaveCount(0);
  await button(page).click();
  await expect(page.locator("#learner-form").getByRole("alert")).toContainText("This preview supports one goal");
  await expect(goal(page)).toHaveValue("learn robotics");
  await page.getByRole("button", { name: "Use the supported goal" }).click();
  await expect(page.getByTestId("generated-plan")).toHaveCount(0);
  await button(page).click();
  await expect(page.getByTestId("generated-plan")).toBeVisible();
});

test("invalid hours show accessible errors with no stale plan", async ({ page }) => {
  await button(page).click();
  for (const invalid of ["", "0", "-1", "six", "Infinity"]) {
    await hours(page).fill(invalid);
    await expect(page.getByTestId("generated-plan")).toHaveCount(0);
    await button(page).click();
    await expect(hours(page)).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#learner-form").getByRole("alert")).toContainText("positive number");
    await expect(page.getByTestId("generated-plan")).toHaveCount(0);
  }
});

test("the form can be completed using the keyboard", async ({ page }) => {
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to your learning plan" })).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await expect(goal(page)).toBeFocused();
  for (let i = 0; i < 4; i++) await page.keyboard.press("Tab");
  await expect(page.getByRole("checkbox", { name: "C essentials", exact: true })).toBeFocused();
  await page.keyboard.press("Space");
  await page.keyboard.press("Tab");
  await expect(hours(page)).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(button(page)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Find the instructions in the noise" })).toBeVisible();
});

test("the mobile layout stays within the viewport", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await button(page).click();
  const positions = await page.evaluate(() => {
    const form = document.querySelector(".input-panel")!.getBoundingClientRect();
    const result = document.querySelector(".result-panel")!.getBoundingClientRect();
    return { width: document.documentElement.scrollWidth, viewport: window.innerWidth, formBottom: form.bottom, resultTop: result.top };
  });
  expect(positions.width).toBeLessThanOrEqual(positions.viewport);
  expect(positions.resultTop).toBeGreaterThanOrEqual(positions.formBottom);
  await expect(page.getByRole("heading", { name: "Make your first C program run" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("mobile.png"), fullPage: true });
});

test("generation still works offline after the page has loaded", async ({ page, context }) => {
  await context.setOffline(true);
  await hours(page).fill("0.5");
  await button(page).click();
  await expect(page.getByRole("heading", { name: "Make your first C program run" })).toBeVisible();
  await page.getByRole("checkbox", { name: "C essentials", exact: true }).check();
  await button(page).click();
  await expect(page.getByRole("heading", { name: "Find the instructions in the noise" })).toBeVisible();
  await expect(page.getByText(/60 minutes remain/)).toBeVisible();
});

test("the whole graph is available before generating a task", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Your whole roadmap" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Learning roadmap" }).getByRole("listitem")).toHaveCount(13);
  await expect(page.getByRole("list", { name: "Learning roadmap" }).getByRole("button", { name: /Hack assembler/ })).toBeVisible();
  await expect(page.locator(".dependency-edge.prerequisite")).toHaveCount(18);
  await expect(page.locator(".dependency-edge.useful_for")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Graph", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("graph and list inspect the same prerequisites, exercise, and sources", async ({ page }) => {
  const steps = page.getByRole("list", { name: "Learning roadmap" });
  const inspector = page.locator("#step-details");
  await steps.getByRole("button", { name: /Symbol tables/ }).click();
  await expect(inspector.getByRole("heading", { name: "Symbol tables", exact: true })).toBeVisible();
  await expect(inspector.getByRole("button", { name: /C strings & arrays/ })).toBeVisible();
  await expect(inspector.getByRole("button", { name: /Hack instructions/ })).toBeVisible();
  await expect(inspector.getByRole("link", { name: /Structures in C/ })).toHaveAttribute("href", /Structures.html$/);
  const graphDetails = await inspector.innerText();
  await page.getByRole("button", { name: "List", exact: true }).click();
  await expect(steps.getByRole("listitem")).toHaveCount(13);
  await expect(steps.getByRole("button", { name: /Symbol tables/ })).toHaveAttribute("aria-pressed", "true");
  expect(await inspector.innerText()).toBe(graphDetails);
  await inspector.getByRole("button", { name: /C strings & arrays/ }).click();
  await expect(inspector.getByRole("heading", { name: "C strings & arrays", exact: true })).toBeVisible();
});

test("search keeps graph context and filters the accessible list", async ({ page }) => {
  await page.getByRole("searchbox", { name: "Search roadmap" }).fill("symbol");
  await expect(page.getByRole("list", { name: "Learning roadmap" }).getByRole("listitem")).toHaveCount(13);
  await expect(page.locator(".search-dimmed")).not.toHaveCount(0);
  await page.getByRole("button", { name: "List", exact: true }).click();
  await expect(page.getByRole("list", { name: "Learning roadmap" }).getByRole("listitem")).toHaveCount(2);
  await expect(page.getByRole("list", { name: "Learning roadmap" }).getByRole("button", { name: /Assembling the pieces/ })).toBeVisible();
  await expect(page.getByRole("list", { name: "Learning roadmap" }).getByRole("button", { name: /Symbol tables/ })).toBeVisible();
  await page.getByRole("searchbox", { name: "Search roadmap" }).fill("not-a-concept");
  await expect(page.getByText(/No steps match your search/)).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(page.getByRole("list", { name: "Learning roadmap" }).getByRole("listitem")).toHaveCount(13);
});

test("zoom and fit keep the map usable", async ({ page }) => {
  const zoom = page.getByRole("group", { name: "Graph zoom" });
  await expect(zoom.getByText("100%", { exact: true })).toBeVisible();
  await zoom.getByRole("button", { name: "Zoom in" }).click();
  await expect(zoom.getByText("115%", { exact: true })).toBeVisible();
  await zoom.getByRole("button", { name: "Fit", exact: true }).click();
  await expect(zoom.getByText("100%", { exact: true })).toBeVisible();
});

test("familiarity is explicit and never treated as assessed mastery", async ({ page }) => {
  const steps = page.getByRole("list", { name: "Learning roadmap" });
  const inspector = page.locator("#step-details");
  await steps.getByRole("button", { name: /C strings & arrays/ }).click();
  await inspector.getByRole("button", { name: "I already know this" }).click();
  await expect(steps.getByRole("button", { name: /C strings & arrays/ })).toContainText("self-reported");
  await expect(inspector.getByText(/not assessed mastery/)).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "C essentials", exact: true })).not.toBeChecked();
  await button(page).click();
  await expect(page.getByRole("heading", { name: "Make your first C program run" })).toBeVisible();
  await inspector.getByRole("button", { name: "Remove familiarity" }).click();
  await expect(page.getByTestId("generated-plan")).toHaveCount(0);
  await expect(steps.getByRole("button", { name: /C strings & arrays/ })).not.toContainText("self-reported");
});

test("keyboard users can inspect nodes and their dependency descriptions", async ({ page }) => {
  const node = page.getByRole("list", { name: "Learning roadmap" }).getByRole("button", { name: /Text parsing/ });
  await node.focus();
  await page.keyboard.press("Enter");
  await expect(node).toBeFocused();
  await expect(node).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#step-details").getByRole("heading", { name: "Text parsing", exact: true })).toBeVisible();
  await expect(node).toHaveAttribute("aria-controls", "step-details");
  await expect(page.locator("#dependency-text-parsing")).toHaveText("Requires C essentials.");
});

test("mobile defaults to a complete readable list with an optional graph", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.getByRole("button", { name: "List", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("list", { name: "Learning roadmap" }).getByRole("listitem")).toHaveCount(13);
  await page.getByRole("list", { name: "Learning roadmap" }).getByRole("button", { name: /Hack assembler/ }).click();
  await expect(page.locator("#step-details").getByRole("heading", { name: "Hack assembler", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Graph", exact: true }).click();
  await expect(page.getByRole("region", { name: "Roadmap graph" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
