# Cookieater

A friendly Chrome extension for viewing, searching, and editing cookies on the
current site. Add, update, import, export, or remove cookies from one compact
popup.

<img src="docs/screenshots/overview.png" alt="Cookieater showing example.com cookies and the search, add, import, export, and clear actions" width="300">

## Install

### From source

Requires Node.js and pnpm.

```sh
git clone https://github.com/mdopeace/cookieater
cd cookieater
pnpm install
pnpm build
```

In Chrome, open `chrome://extensions`, enable **Developer mode**, choose **Load
unpacked**, and select `.output/chrome-mv3`.

## Requirements

- Chrome or a Chromium-based browser with Manifest V3 extension support

## Features

- View cookies for the active site's domain and refresh the list on demand
- Search cookie names, values, and domains as you type
- Edit a cookie's name, value, domain, path, expiration, SameSite, Secure, and
  HttpOnly settings, then save it individually
- Add a cookie, or delete one cookie at a time
- Import cookies from a JSON array and export the current domain's cookies as JSON
- Clear all cookies for the current domain after confirmation

## Screens

<p align="center">
  <img src="docs/screenshots/edit.png" alt="An edited cookie with its unsaved changes indicated and the save action ready" height="260">
  <img src="docs/screenshots/cookie-details.png" alt="Expanded session cookie settings showing its domain, path, expiration, SameSite, Secure, HttpOnly, host-only, and session attributes" height="260">
  <img src="docs/screenshots/add-cookie.png" alt="A new cookie draft ready for its name and value" height="260">
</p>

All screenshots use illustrative `example.com` data, not cookies from a real
browsing session.

## Privacy and permissions

Cookieater handles cookie data locally in your browser; it does not send your
data to a Cookieater server. See the [privacy policy](PRIVACY.md).

- `cookies` — use the browser's cookie API to read and write cookies.
- `<all_urls>` — identify the active tab's hostname and access cookies on sites.

## Development

```sh
pnpm dev      # live-reloading extension
pnpm compile  # type-check
pnpm build    # production build in .output/chrome-mv3
pnpm zip      # package for the Chrome Web Store
```

## Publishing

The initial Chrome Web Store listing has been submitted and is pending review.
Do not run the publishing workflow while that review is in progress.

For future releases, bump the version in `package.json`, then run **Publish
Chrome Web Store** from the Actions tab on `main`. The workflow builds and
validates the extension, uploads it to the existing store item, and submits the
update for review. It does not create GitHub Releases.

The workflow requires these repository Actions secrets in **Settings → Secrets
and variables → Actions**:

- `CWS_PUBLISHER_ID`
- `CWS_EXTENSION_ID`
- `CWS_CLIENT_ID`
- `CWS_CLIENT_SECRET`
- `CWS_REFRESH_TOKEN`

`CWS_PUBLISHER_ID` and `CWS_EXTENSION_ID` are already configured for this
repository. Their values are `29cea7aa-3273-4f9f-bde0-b2568f046f7d` and
`eokikmfhgicnmkhldphchbligfgjbkbi`, respectively. Add the remaining three
secrets using Google's
[Chrome Web Store API setup guide](https://developer.chrome.com/docs/webstore/using-api)
to create OAuth credentials and a refresh token with the Chrome Web Store
scope. Keep the OAuth client secret and refresh token in GitHub Secrets, not in
the repository or chat.
