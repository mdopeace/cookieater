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

For future releases, run **Publish Chrome Web Store** from the Actions tab on
`main`. Choose a patch, minor, or major bump, or enter an exact
`MAJOR.MINOR.PATCH` version. The workflow creates and squash-merges a version
bump PR, builds and validates the extension, uploads it to the existing store
item, and submits the update for review. It does not create GitHub Releases.

The workflow requires these repository Actions secrets in **Settings → Secrets
and variables → Actions**:

- `CWS_PUBLISHER_ID`
- `CWS_EXTENSION_ID`
- `CWS_CLIENT_ID`
- `CWS_CLIENT_SECRET`
- `CWS_REFRESH_TOKEN`

`CWS_PUBLISHER_ID` and `CWS_EXTENSION_ID` are already configured for this
repository. To create the remaining OAuth credentials:

1. In the [Google Cloud Console](https://console.cloud.google.com/), select or
   create a project and enable the **Chrome Web Store API**.
2. Configure the OAuth consent screen and add your Google account as a test
   user if the app is in testing. For a durable workflow token, note that
   refresh tokens issued while an external consent screen is in **Testing**
   expire after seven days; move the app to **In production** and complete any
   verification Google requires.
3. Under **APIs & Services → Credentials**, create an OAuth client ID for a
   **Web application** and add
   `https://developers.google.com/oauthplayground` as an authorized redirect
   URI.
4. Open the [OAuth 2.0 Playground](https://developers.google.com/oauthplayground),
   enable **Use your own OAuth credentials** in its settings, and enter the
   client ID and client secret.
5. In **Step 1**, enter the scope
   `https://www.googleapis.com/auth/chromewebstore`, authorize with the Google
   account that owns the Web Store item, then exchange the authorization code
   for tokens in **Step 2**.
6. In the repository's **Settings → Secrets and variables → Actions**, add the
   client ID as `CWS_CLIENT_ID`, client secret as `CWS_CLIENT_SECRET`, and
   refresh token as `CWS_REFRESH_TOKEN`.

Keep the client secret and refresh token private. See Google's
[Chrome Web Store API guide](https://developer.chrome.com/docs/webstore/using-api)
for the official setup and API details.
