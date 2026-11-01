/// <reference types="node" />

import {
  chromium,
  expect,
  test,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import { resolve } from "node:path";

const extensionPath = resolve(".output/chrome-mv3");

let context: BrowserContext;
let popup: Page;

test.beforeEach(async () => {
  context = await chromium.launchPersistentContext("", {
    channel: "chromium",
    headless: true,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  // Read the extension ID from Chrome's manager without depending on the
  // background service worker's lifecycle.
  const manager = await context.newPage();
  await manager.goto("chrome://extensions/");
  await manager.locator("extensions-item").first().waitFor();
  const extensionId = await manager.locator("extensions-item").evaluateAll(
    (items) => {
      const item = items.find((candidate) => {
        const name = candidate.shadowRoot
          ?.querySelector<HTMLElement>("#name")
          ?.innerText.trim();
        return name?.toLowerCase() === "cookieater";
      });
      return item?.getAttribute("id") ?? null;
    },
  );
  expect(extensionId, "Cookieater should be loaded in Chromium").toBeTruthy();

  popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.locator(".domain-display").waitFor();
});

test.afterEach(async () => {
  await context?.close();
});

async function setDomain(domain = "example.com") {
  await popup.locator(".domain-display").click();
  const input = popup.locator(".domain-edit-layer input");
  await input.fill(domain);
  await input.press("Enter");
  await expect(popup.locator(".domain-display")).toHaveText(domain);
}

async function seedCookies(names: string[]) {
  await context.addCookies(
    names.map((name) => ({
      name,
      value: `original-${name}`,
      url: "https://example.com/",
      sameSite: "Lax" as const,
    })),
  );
}

test("Save All persists edits to multiple real browser cookies", async () => {
  await seedCookies(["first", "second"]);
  await setDomain();
  await expect(popup.locator(".cookie-card")).toHaveCount(2);

  const values = popup.getByRole("textbox", { name: / value$/ });
  await values.nth(0).fill("updated-first");
  await values.nth(1).fill("updated-second");
  await popup.getByRole("button", { name: "Save All" }).click();
  await expect(popup.getByRole("button", { name: "Save All" })).toBeDisabled();

  await expect.poll(async () => {
    const cookies = await context.cookies("https://example.com/");
    return Object.fromEntries(cookies.map(({ name, value }) => [name, value]));
  }).toEqual({ first: "updated-first", second: "updated-second" });
});

test("Save All continues saving other cookies when one cookie is invalid", async () => {
  await seedCookies(["first", "second"]);
  await setDomain();
  await expect(popup.locator(".cookie-card")).toHaveCount(2);

  const values = popup.getByRole("textbox", { name: / value$/ });
  await popup.getByRole("button", { name: "Expand first details" }).click();
  await popup.locator(".cookie-card").nth(0).locator(".advanced-fields input").first().fill("[");
  await values.nth(1).fill("saved-despite-error");
  await popup.getByRole("button", { name: "Save All" }).click();

  await expect(popup.locator(".feedback-error").filter({ hasText: "could not be saved" })).toBeVisible();
  await expect.poll(async () => {
    const cookies = await context.cookies("https://example.com/");
    return Object.fromEntries(cookies.map(({ name, value }) => [name, value]));
  }).toEqual({ first: "original-first", second: "saved-despite-error" });
  await expect(popup.getByRole("button", { name: "Save All" })).toBeEnabled();
});

test("SameSite=None is persisted as Secure and the cookie can then be deleted", async () => {
  await seedCookies(["cookieater_test"]);
  await setDomain();
  await expect(popup.locator(".cookie-card")).toHaveCount(1);

  await popup.getByRole("button", { name: "Expand cookieater_test details" }).click();
  await popup.locator(".cookie-card select").selectOption("no_restriction");
  await popup.getByRole("button", { name: "Save All" }).click();

  await expect.poll(async () => {
    const [cookie] = await context.cookies("https://example.com/");
    return cookie && { secure: cookie.secure, sameSite: cookie.sameSite };
  }).toEqual({ secure: true, sameSite: "None" });

  await popup.getByRole("button", { name: "Delete cookieater_test" }).click();
  await expect.poll(async () => context.cookies("https://example.com/")).toHaveLength(0);
});

test("switching domains asks before discarding unsaved edits", async () => {
  await seedCookies(["keep_me"]);
  await setDomain();
  await popup.getByRole("textbox", { name: / value$/ }).fill("unsaved-value");

  let confirmMessage = "";
  popup.once("dialog", async (dialog) => {
    confirmMessage = dialog.message();
    await dialog.dismiss();
  });
  await popup.locator(".domain-display").click();
  const input = popup.locator(".domain-edit-layer input");
  await input.fill("other.example");
  await input.press("Enter");

  expect(confirmMessage).toContain("Discard unsaved");
  await expect(popup.locator(".domain-display")).toHaveText("example.com");
  await expect(popup.getByRole("textbox", { name: / value$/ })).toHaveValue(
    "unsaved-value",
  );
});

test("refresh asks before discarding unsaved edits", async () => {
  await seedCookies(["keep_me"]);
  await setDomain();
  await popup.getByRole("textbox", { name: / value$/ }).fill("unsaved-value");

  let confirmMessage = "";
  popup.once("dialog", async (dialog) => {
    confirmMessage = dialog.message();
    await dialog.dismiss();
  });
  await popup.locator(".domain-bar > button").click();

  expect(confirmMessage).toContain("Discard unsaved");
  await expect(popup.getByRole("textbox", { name: / value$/ })).toHaveValue(
    "unsaved-value",
  );
});

test("Clear All removes real browser cookies after confirmation", async () => {
  await seedCookies(["one", "two"]);
  await setDomain();
  await expect(popup.locator(".cookie-card")).toHaveCount(2);

  popup.once("dialog", (dialog) => dialog.accept());
  await popup.getByRole("button", { name: "Clear All" }).click();

  await expect.poll(async () => context.cookies("https://example.com/")).toHaveLength(0);
  await expect(popup.getByText("No cookies found")).toBeVisible();
});
