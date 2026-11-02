/// <reference types="node" />

import {
  chromium,
  expect,
  test,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import { readFile } from "node:fs/promises";
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
        return name?.toLowerCase().startsWith("cookieater");
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

test("nested-path cookies are listed, exported, and cleared", async () => {
  await context.addCookies([
    {
      name: "nested",
      value: "value",
      domain: "example.com",
      path: "/account",
    },
  ]);
  await setDomain();
  await expect(popup.locator(".cookie-card")).toHaveCount(1);

  const downloadPromise = popup.waitForEvent("download");
  await popup.getByRole("button", { name: "Export" }).click();
  const download = await downloadPromise;
  const filePath = await download.path();
  expect(filePath).toBeTruthy();
  expect(JSON.parse(await readFile(filePath!, "utf8"))).toHaveLength(1);

  popup.once("dialog", (dialog) => dialog.accept());
  await popup.getByRole("button", { name: "Clear All" }).click();
  await expect.poll(async () => context.cookies("https://example.com/account/")).toHaveLength(0);
});

test("clearing the selected domain clears its cookie list", async () => {
  await seedCookies(["still_in_browser"]);
  await setDomain();

  await popup.locator(".domain-display").click();
  const input = popup.locator(".domain-edit-layer input");
  await input.fill("");
  await input.press("Enter");

  await expect(popup.locator(".domain-display")).toHaveText("No domain");
  await expect(popup.locator(".popup-header-count")).toHaveText("0 cookies");
  await expect(popup.getByText("No cookies found")).toBeVisible();
  await expect.poll(async () => context.cookies("https://example.com/")).toHaveLength(1);
});

test("the latest domain load wins when domain changes overlap", async () => {
  const staleCookies = Array.from({ length: 100 }, (_, index) => ({
    name: `stale_${index}`,
    value: "value",
    url: "https://stale.example.com/",
  }));
  await context.addCookies(staleCookies);
  await seedCookies(["current"]);

  await popup.locator(".domain-display").click();
  const input = popup.locator(".domain-edit-layer input");
  await input.fill("stale.example.com");
  await input.press("Enter");
  await popup.locator(".domain-display").click();
  await input.fill("example.com");
  await input.press("Enter");

  await expect(popup.locator(".domain-display")).toHaveText("example.com");
  await expect(popup.locator(".cookie-card")).toHaveCount(1);
  await expect(popup.locator(".cookie-fields input").first()).toHaveValue("current");
  await popup.waitForTimeout(500);
  await expect(popup.locator(".cookie-fields input").first()).toHaveValue("current");
});

test("parent-domain cookies with nested paths appear on subdomains", async () => {
  await context.addCookies([
    {
      name: "parent_nested",
      value: "value",
      domain: ".example.com",
      path: "/account",
    },
  ]);
  await setDomain("shop.example.com");
  await expect(popup.locator(".cookie-card")).toHaveCount(1);
  await expect(popup.locator(".cookie-fields input").first()).toHaveValue("parent_nested");
});

test("saving identity changes replaces the original cookie", async () => {
  await seedCookies(["before"]);
  await setDomain();
  await popup.getByRole("button", { name: "Expand before details" }).click();
  await popup.locator(".cookie-fields input").nth(0).fill("after");
  const advanced = popup.locator(".advanced-fields input");
  await advanced.nth(0).fill("sub.example.com");
  await advanced.nth(1).fill("/account");
  await popup.getByRole("button", { name: "Save All" }).click();

  await expect.poll(async () => context.cookies("https://sub.example.com/account/")).toEqual(
    expect.arrayContaining([expect.objectContaining({ name: "after", path: "/account" })]),
  );
  await expect.poll(async () => context.cookies("https://example.com/")).toHaveLength(0);
});

test("failed identity changes restore the original cookie", async () => {
  await seedCookies(["before_restore"]);
  await setDomain();
  await popup.getByRole("button", { name: "Expand before_restore details" }).click();
  await popup.locator(".advanced-fields input").nth(0).fill("[");
  await popup.getByRole("button", { name: "Save All" }).click();

  await expect(popup.locator(".feedback-error").filter({ hasText: "could not be saved" })).toBeVisible();
  await expect.poll(async () => context.cookies("https://example.com/")).toEqual(
    expect.arrayContaining([expect.objectContaining({ name: "before_restore" })]),
  );
  await expect.poll(async () =>
    (await context.cookies("https://sub.example.com/")).map(({ name }) => name),
  ).toEqual(["before_restore"]);
});

test("deleting a renamed unsaved cookie removes its browser original", async () => {
  await seedCookies(["before_delete"]);
  await setDomain();
  await popup.locator(".cookie-fields input").nth(0).fill("after_delete");
  await popup.getByRole("button", { name: "Delete after_delete" }).click();

  await expect.poll(async () => context.cookies("https://example.com/")).toHaveLength(0);
  await expect(popup.getByText("No cookies found")).toBeVisible();
});

test("Clear All removes original cookies with unsaved identity edits", async () => {
  await seedCookies(["before_clear"]);
  await setDomain();
  await popup.locator(".cookie-fields input").nth(0).fill("after_clear");

  popup.once("dialog", (dialog) => dialog.accept());
  await popup.getByRole("button", { name: "Clear All" }).click();
  await expect.poll(async () => context.cookies("https://example.com/")).toHaveLength(0);
});

test("cookie fields stay disabled while Save All is in progress", async () => {
  const names = Array.from({ length: 30 }, (_, index) => `save_${index}`);
  await seedCookies(names);
  await setDomain();
  const valueInputs = popup.locator(".cookie-fields > div:nth-child(2) input");
  for (let index = 0; index < names.length; index++) {
    await valueInputs.nth(index).fill(`updated_${index}`);
  }

  await popup.getByRole("button", { name: "Save All" }).click();
  await expect(valueInputs.first()).toBeDisabled();
  await expect(valueInputs.first()).toBeEnabled({ timeout: 10_000 });
});

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
