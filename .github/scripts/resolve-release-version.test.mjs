import assert from "node:assert/strict";
import test from "node:test";
import { resolveReleaseVersion } from "./resolve-release-version.mjs";

test("increments patch, minor, and major versions", () => {
  assert.equal(resolveReleaseVersion("0.1.0", "patch"), "0.1.1");
  assert.equal(resolveReleaseVersion("0.1.0", "minor"), "0.2.0");
  assert.equal(resolveReleaseVersion("0.1.0", "major"), "1.0.0");
});

test("uses a valid exact version instead of the selected bump", () => {
  assert.equal(resolveReleaseVersion("0.1.0", "patch", "1.2.3"), "1.2.3");
});

test("rejects malformed, unsupported, or non-increasing versions", () => {
  assert.throws(() => resolveReleaseVersion("0.1.0", "build"), /Unsupported version bump/);
  assert.throws(() => resolveReleaseVersion("0.1.0", "patch", "v1.2.3"), /Invalid version/);
  assert.throws(() => resolveReleaseVersion("0.1.0", "patch", "0.1.0"), /must be greater/);
  assert.throws(() => resolveReleaseVersion("0.1.0", "patch", "0.0.9"), /must be greater/);
  assert.throws(() => resolveReleaseVersion("01.1.0", "patch"), /Invalid version/);
});
