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
pnpm build
pnpm zip
```

Pull requests run these checks automatically. Please describe the user-facing
change and include screenshots when a change affects the interface.

## Releases

Release publishing is a maintainer task. See the [release guide](docs/releasing.md)
for the workflow and required GitHub Actions secrets.
