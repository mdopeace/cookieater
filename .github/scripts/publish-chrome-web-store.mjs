import { readFile, readdir } from "node:fs/promises";

const required = [
  "CWS_PUBLISHER_ID",
  "CWS_EXTENSION_ID",
  "CWS_CLIENT_ID",
  "CWS_CLIENT_SECRET",
  "CWS_REFRESH_TOKEN",
];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  throw new Error(`Missing GitHub Actions secrets: ${missing.join(", ")}`);
}

async function checkedJson(response, action) {
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${action} failed (${response.status}): ${text}`);
  }
  return text ? JSON.parse(text) : {};
}

const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    client_id: process.env.CWS_CLIENT_ID,
    client_secret: process.env.CWS_CLIENT_SECRET,
    refresh_token: process.env.CWS_REFRESH_TOKEN,
    grant_type: "refresh_token",
  }),
});
const { access_token: accessToken } = await checkedJson(
  tokenResponse,
  "Refreshing Chrome Web Store API token",
);
if (!accessToken) throw new Error("Google did not return an access token.");

const publisherId = encodeURIComponent(process.env.CWS_PUBLISHER_ID);
const extensionId = encodeURIComponent(process.env.CWS_EXTENSION_ID);
const itemUrl =
  `https://chromewebstore.googleapis.com/v2/publishers/${publisherId}/items/${extensionId}`;
const archives = (await readdir(".output")).filter((name) =>
  /^cookieater-.+-chrome\.zip$/.test(name),
);
if (archives.length !== 1) {
  throw new Error(`Expected one Chrome package in .output; found ${archives.length}.`);
}

const uploadResponse = await fetch(
  `https://chromewebstore.googleapis.com/upload/v2/publishers/${publisherId}/items/${extensionId}:upload`,
  {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/zip",
    },
    body: await readFile(`.output/${archives[0]}`),
  },
);
const uploaded = await checkedJson(uploadResponse, "Uploading extension");
let uploadState = uploaded.uploadState;

for (let attempt = 0; uploadState === "IN_PROGRESS"; attempt++) {
  if (attempt === 12) {
    throw new Error("Chrome Web Store upload is still processing after 2 minutes.");
  }
  await new Promise((resolve) => setTimeout(resolve, 10_000));
  const statusResponse = await fetch(`${itemUrl}:fetchStatus`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  const status = await checkedJson(statusResponse, "Checking upload status");
  uploadState = status.lastAsyncUploadState;
}
if (uploadState !== "SUCCEEDED") {
  throw new Error(`Chrome Web Store upload did not succeed: ${uploadState ?? "unknown state"}`);
}

const publishResponse = await fetch(`${itemUrl}:publish`, {
  method: "POST",
  headers: { authorization: `Bearer ${accessToken}` },
});
const published = await checkedJson(publishResponse, "Submitting extension for review");
console.log(`Chrome Web Store submission accepted: ${JSON.stringify(published)}`);
