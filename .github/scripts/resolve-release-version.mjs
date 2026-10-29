import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function parseVersion(version) {
  const match = versionPattern.exec(version);
  if (!match) {
    throw new Error(`Invalid version "${version}"; expected MAJOR.MINOR.PATCH.`);
  }

  const parts = match.slice(1).map(Number);
  if (parts.some((part) => !Number.isSafeInteger(part))) {
    throw new Error(`Version "${version}" contains a component that is too large.`);
  }
  return parts;
}

export function resolveReleaseVersion(currentVersion, bump, exactVersion = "") {
  const current = parseVersion(currentVersion);
  const exact = exactVersion.trim();
  let next;

  if (exact) {
    next = parseVersion(exact);
  } else {
    switch (bump) {
      case "major":
        next = [current[0] + 1, 0, 0];
        break;
      case "minor":
        next = [current[0], current[1] + 1, 0];
        break;
      case "patch":
        next = [current[0], current[1], current[2] + 1];
        break;
      default:
        throw new Error(`Unsupported version bump "${bump}".`);
    }

    if (next.some((part) => !Number.isSafeInteger(part))) {
      throw new Error("The requested version exceeds the supported numeric range.");
    }
  }

  const isGreater = next.some(
    (part, index) =>
      part > current[index] &&
      next.slice(0, index).every((previous, previousIndex) => previous === current[previousIndex]),
  );
  if (!isGreater) {
    throw new Error(
      `Version ${next.join(".")} must be greater than the current version ${currentVersion}.`,
    );
  }

  return next.join(".");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [, , bump, exactVersion = ""] = process.argv;
  const { version: currentVersion } = JSON.parse(
    await readFile("package.json", "utf8"),
  );
  process.stdout.write(`${resolveReleaseVersion(currentVersion, bump, exactVersion)}\n`);
}
