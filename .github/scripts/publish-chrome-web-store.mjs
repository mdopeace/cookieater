import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import JSZip from "jszip";

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
const chromeManifest = JSON.parse(
  await readFile(".output/chrome-mv3/manifest.json", "utf8"),
);
const archiveName = `cookieater-${chromeManifest.version}-chrome.zip`;
const archives = await readdir(".output");
if (!archives.includes(archiveName)) {
  throw new Error(`Expected Chrome package ${archiveName} in .output.`);
}

async function sourceFiles(directory, prefix = "") {
  const entries = new Map();
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolutePath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      for (const [path, data] of await sourceFiles(absolutePath, relativePath)) {
        entries.set(path, data);
      }
    } else if (entry.isFile()) {
      entries.set(relativePath, await readFile(absolutePath));
    }
  }
  return entries;
}

const zip = await JSZip.loadAsync(await readFile(resolve(".output", archiveName)));
const zipFiles = new Map();
for (const [path, entry] of Object.entries(zip.files)) {
  if (!entry.dir) {
    zipFiles.set(path.replaceAll("\\", "/"), await entry.async("nodebuffer"));
  }
}

const sourceDir = resolve(".output/chrome-mv3");
const sourceFilesMap = await sourceFiles(sourceDir);
if (
  zipFiles.size !== sourceFilesMap.size ||
  [...sourceFilesMap.keys()].some((path) => {
    const zipFile = zipFiles.get(path);
    const sourceFile = sourceFilesMap.get(path);
    return !zipFile || !sourceFile || !zipFile.equals(sourceFile);
  })
) {
  throw new Error(
    `Chrome ZIP ${archiveName} does not exactly match the built .output/chrome-mv3 directory.`,
  );
}

const uploadResponse = await fetch(
  `https://chromewebstore.googleapis.com/upload/v2/publishers/${publisherId}/items/${extensionId}:upload`,
  {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/zip",
    },
    body: await readFile(`.output/${archiveName}`),
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
