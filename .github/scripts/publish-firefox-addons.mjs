import { readFile, readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import JSZip from "jszip";

const required = ["AMO_JWT_ISSUER", "AMO_JWT_SECRET"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  throw new Error(`Missing GitHub Actions secrets: ${missing.join(", ")}`);
}

const manifest = JSON.parse(
  await readFile(".output/firefox-mv3/manifest.json", "utf8"),
);
const gecko = manifest.browser_specific_settings?.gecko;
if (gecko?.id !== "cookieater@mdopeace.github.io") {
  throw new Error("Firefox package does not contain the configured Gecko extension ID.");
}

const archiveName = `cookieater-${manifest.version}-firefox.zip`;
const output = resolve(".output");
const archives = await readdir(output);
if (!archives.includes(archiveName)) {
  throw new Error(`Expected Firefox package ${archiveName} in .output.`);
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

const zip = await JSZip.loadAsync(await readFile(resolve(output, archiveName)));
const zipFiles = new Map();
for (const [path, entry] of Object.entries(zip.files)) {
  if (!entry.dir) {
    zipFiles.set(path.replaceAll("\\", "/"), await entry.async("nodebuffer"));
  }
}

const sourceDir = resolve(".output/firefox-mv3");
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
    `Firefox ZIP ${archiveName} does not exactly match the built .output/firefox-mv3 directory.`,
  );
}

const webExt = resolve("node_modules/.bin/web-ext");
const result = spawnSync(
  webExt,
  [
    "sign",
    "--source-dir",
    resolve(".output/firefox-mv3"),
    "--artifacts-dir",
    resolve(".output/web-ext-artifacts"),
    "--channel",
    "listed",
    "--api-key",
    process.env.AMO_JWT_ISSUER,
    "--api-secret",
    process.env.AMO_JWT_SECRET,
    "--approval-timeout",
    "0",
    "--no-input",
  ],
  { stdio: "inherit" },
);

if (result.error) throw result.error;
if (result.status !== 0) {
  throw new Error(`Mozilla Add-ons submission failed with exit code ${result.status}.`);
}

console.log(
  `Mozilla Add-ons submission accepted for version ${manifest.version}.`,
);
