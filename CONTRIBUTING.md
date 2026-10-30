# Contributing

## Set up the project

Use Node.js 22 and pnpm 12.16.1, matching the CI environment.

```sh
git clone https://github.com/mdopeace/cookieater.git
cd cookieater
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm dev` starts the extension in development mode. To load it manually,
build it with `pnpm build`, then load `.output/chrome-mv3` from
`chrome://extensions` with Developer mode enabled.

## Validate changes

Before opening a pull request, run the checks used by CI:

```sh
node --test .github/scripts/resolve-release-version.test.mjs
pnpm compile
pnpm compile:e2e
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e:run
pnpm zip
```

The end-to-end suite launches an isolated Chromium profile with the unpacked
extension and verifies cookie operations against Chromium's real cookie store.
On Linux, install browser system dependencies with
`pnpm exec playwright install --with-deps chromium`.

Pull requests run these checks automatically. Please describe the user-facing
change and include screenshots when a change affects the interface.

## Releases

Release publishing is a maintainer task. See the [release guide](docs/releasing.md)
for the workflow and required GitHub Actions secrets.
