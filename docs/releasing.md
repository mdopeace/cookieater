# Browser extension releases

## Before the first release

The `Publish Browser Extension Stores` workflow requires these repository
Actions secrets in **Settings → Secrets and variables → Actions**:

- `CWS_PUBLISHER_ID`
- `CWS_EXTENSION_ID`
- `CWS_CLIENT_ID`
- `CWS_CLIENT_SECRET`
- `CWS_REFRESH_TOKEN`
- `AMO_JWT_ISSUER`
- `AMO_JWT_SECRET`

Create or select a project in the [Google Cloud Console](https://console.cloud.google.com/)
and enable the **Chrome Web Store API**. Configure Google Auth Platform with an
external audience and create a **Web application** OAuth client whose authorized
redirect URI is `https://developers.google.com/oauthplayground`.

In the consent screen's **Data Access** settings, add the scope
`https://www.googleapis.com/auth/chromewebstore`. For a durable workflow token,
the app must be **In production**; refresh tokens from an external app in
**Testing** expire after seven days. Google may require verification for the
sensitive Chrome Web Store scope.

Use the [OAuth 2.0 Playground](https://developers.google.com/oauthplayground)
with **Use your own OAuth credentials** enabled. Enter the OAuth client's ID
and secret, authorize the Chrome Web Store scope with the Google account that
owns the Web Store item, and exchange the authorization code for tokens. Store
the client ID, client secret, and refresh token in the matching GitHub Actions
secrets. All three values must come from the same OAuth client and authorization
flow. Keep the client secret and refresh token private.

See Google's [Chrome Web Store API guide](https://developer.chrome.com/docs/webstore/using-api)
for official API details.

For Firefox, create API credentials in the Mozilla Add-ons Developer Hub:
open **Tools for developers → Manage API keys**, then create a JWT issuer and
secret. Store them as `AMO_JWT_ISSUER` and `AMO_JWT_SECRET` GitHub Actions
secrets. Keep the JWT secret private. The extension uses the stable Gecko ID
`cookieater@mdopeace.github.io`; do not change it for an existing AMO listing.

## Run a release

1. Make sure `main` contains the changes to release and that neither initial
   store listing is still under review.
2. In GitHub, open **Actions → Publish Browser Extension Stores → Run workflow** and
   select `main`.
3. Choose `patch`, `minor`, or `major`, or enter an exact higher
   `MAJOR.MINOR.PATCH` version. An exact version overrides the bump choice.
4. Start the workflow and monitor the run in Actions.

The workflow creates and squash-merges one version-bump pull request, builds
and validates both Chrome and Firefox packages, uploads the Chrome package to
the Chrome Web Store, and submits the Firefox package to Mozilla Add-ons. It
does not create a GitHub Release or bypass either store's review process.
Mozilla and Chrome reviews remain independent, so one store may approve while
the other rejects or continues reviewing.

The version-bump pull request is merged before the package is built and
submitted. If a later workflow step fails, inspect the run and current version
before retrying. A workflow rerun preserves the version already merged by the
attempt; it does not calculate another bump. The Firefox submission script
also verifies that the Firefox ZIP exactly matches the built Firefox source
directory before contacting Mozilla Add-ons.
