# Plain Text Compose Helper

A Thunderbird extension for writing plain-text emails that follow
mailing-list and patch-submission conventions (see, for example,
[kernel.org's Thunderbird guide](https://www.kernel.org/doc/html/latest/process/email-clients.html#thunderbird-gui)).
It's meant to grow into a small toolbox of aids for that kind of email
rather than a single fixed feature.

The first feature: a vertical column-ruler line inside the message compose
editor while writing a **plain-text** email. The ruler is hidden
automatically in HTML compose windows, since column wrapping doesn't apply
there.

## Features

- Ruler line at column 80 by default (configurable).
- Toolbar button in the compose window to toggle the ruler on/off for that
  window.
- Options page (column count, line color, enabled-by-default) under the
  extension's settings.

## How it works

Thunderbird's `browser.scripting.compose.registerScripts()` API injects
`compose.js` and `ruler.css` into every compose window's editor document.
`ruler.css` defines a `body::after` rule, positioned with `position: fixed`
and the CSS `ch` unit (the width of the "0" glyph in the current font) so
the line lands at the right column without any manual text measurement.
`compose.js` asks the background page (`background.js`) whether the
current window is plain-text (`browser.compose.getComposeDetails`) and for
the saved settings, then just sets a few CSS custom properties (column
offset, color, visibility) that the stylesheet reads.

Driving the ruler from a registered stylesheet rather than a JS-created DOM
node also means Thunderbird removes it automatically the instant the addon
is disabled — the same lifecycle handling as `tabs.insertCSS` — with no
cleanup code needed on our end.

`registerScripts()` only adds an entry to a registry that Thunderbird
checks when a compose window *opens*, so it doesn't retroactively cover
windows that were already open when the addon (re)started. `background.js`
handles that case itself: on startup it queries for existing
`messageCompose` tabs and injects `compose.js`/`ruler.css` into each one
directly via `browser.scripting.executeScript`/`insertCSS`. `compose.js`
guards against running twice in the same window in case that manual
injection races with a registered one.

## Loading it in Thunderbird for testing

1. Open Thunderbird.
2. Go to **Tools → Developer Tools → Debug Add-ons** (or open
   `about:debugging` in a Thunderbird tab).
3. Click **Load Temporary Add-on...**.
4. Select `manifest.json` in this folder.
5. Open a **new plain-text compose window** (Write a new message, or from
   an existing message's "Compose" menu choose plain text format) and
   confirm the red ruler line appears at column 80.
6. Open a new **HTML** compose window and confirm the ruler does *not*
   appear.
7. Click the ruler icon in the compose window's toolbar to toggle the line
   on/off.
8. Open the extension's **Preferences** (from the Add-ons Manager entry
   for "Plain Text Compose Helper") to change the column count, line
   color, or whether the ruler is shown by default — changes apply
   immediately to any already-open compose window.
9. With a plain-text compose window still open, reload the add-on from the
   debugging page and confirm that window keeps (or regains) its ruler
   instead of needing to be closed and reopened.

Temporary add-ons are removed when Thunderbird restarts; reload via the
same debugging page when needed during development.

## Publishing

Two GitHub Actions workflows (using [kewisch/action-web-ext](https://github.com/kewisch/action-web-ext))
handle packaging and publishing:

- [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs `web-ext lint`
  and `web-ext build` on every push to `main` and on pull requests, and
  uploads the packaged `.xpi` as a workflow artifact.
- [`.github/workflows/publish.yml`](.github/workflows/publish.yml) runs when
  a GitHub Release is published: it lints, builds, and submits the `.xpi` to
  [addons.thunderbird.net](https://addons.thunderbird.net) (ATN) as a
  **listed** (publicly searchable) add-on, then attaches the signed `.xpi`
  to the release if ATN's review finishes in time.

### One-time setup

1. **Create ATN API credentials.** Sign in to
   [addons.thunderbird.net](https://addons.thunderbird.net), go to
   **Developer Hub → Manage API Keys**, and generate a JWT issuer/secret
   pair.
2. **Add them as repo secrets** (Settings → Secrets and variables →
   Actions): `ATN_SIGN_KEY` (issuer) and `ATN_SIGN_SECRET` (secret).
3. **Create the initial ATN listing manually.** ATN's API can add new
   *versions* to an existing listed add-on, but can't create the initial
   public listing (name, summary, category, first upload) — that part of
   the review requires the [ATN submission
   wizard](https://addons.thunderbird.net/developers/addon/submit/upload-listed).
   Do this once, by hand, for version `1.0.0`. After that, this repo's
   `publish.yml` workflow can submit every subsequent version.

   ATN takes the listing icon straight from the extension's own
   `manifest.json` `icons` map at submission time — there's no separate
   upload field for it in the developer hub. `manifest.json` includes a
   `128` entry ([`icons/store-icon-128.png`](icons/store-icon-128.png), a
   PNG rendition of `icons/ruler.svg`) for this; a version submitted
   without it won't get a listing icon.

### Releasing a new version

1. Bump `version` in [`manifest.json`](manifest.json) and commit.
2. Tag the commit (`git tag vX.Y.Z && git push origin vX.Y.Z`) and create a
   GitHub Release for that tag (via the GitHub UI, or
   `gh release create vX.Y.Z`).
3. Publishing the release triggers `publish.yml`, which submits the new
   version to ATN for review.

Listed add-ons go through human review on ATN, which can take longer than
the workflow waits — that's expected and not treated as a failure. Check
the add-on's status on ATN directly if the signed `.xpi` isn't attached to
the release.
