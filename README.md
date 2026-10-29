# Cookieater

A friendly cookie editor browser extension. View, search, edit, add, import, export, and delete cookies for the current site.

## Development

Requires Node.js and pnpm.

```sh
pnpm install
pnpm dev      # live-reloading extension
pnpm compile  # type-check
pnpm build    # production build in .output/chrome-mv3
pnpm zip      # package for the Chrome Web Store
```

Load the unpacked extension from `.output/chrome-mv3` via `chrome://extensions` → Developer mode → Load unpacked.

## Permissions

- `cookies` — read and write cookies you manage in the popup.
- `<all_urls>` — look up the active tab's host and access its cookies.

Everything runs locally in the popup. See [PRIVACY.md](PRIVACY.md).

## Publishing

The store listing still needs at least one screenshot (1280×800 or 640×400) and a hosted privacy policy URL. Put screenshots in `docs/screenshots/`.
