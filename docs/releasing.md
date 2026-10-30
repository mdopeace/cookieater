# Chrome Web Store releases

## Before the first release

The `Publish Chrome Web Store` workflow requires these repository Actions
secrets in **Settings → Secrets and variables → Actions**:

- `CWS_PUBLISHER_ID`
- `CWS_EXTENSION_ID`
- `CWS_CLIENT_ID`
- `CWS_CLIENT_SECRET`
- `CWS_REFRESH_TOKEN`

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

## Run a release

1. Make sure `main` contains the changes to release and that the initial Web
   Store listing is not still under review.
2. In GitHub, open **Actions → Publish Chrome Web Store → Run workflow** and
   select `main`.
3. Choose `patch`, `minor`, or `major`, or enter an exact higher
   `MAJOR.MINOR.PATCH` version. An exact version overrides the bump choice.
4. Start the workflow and monitor the run in Actions.

The workflow creates and squash-merges a version-bump pull request, builds and
validates the extension package, uploads it to the existing Web Store item, and
submits the update for review. It does not create a GitHub Release or bypass
Chrome Web Store review.

The version-bump pull request is merged before the package is built and
submitted. If a later workflow step fails, inspect the run and current version
before retrying; a retry will calculate a new version from `main`.
