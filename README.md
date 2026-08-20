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

## Known limitation: windows opened before the addon is enabled

`registerScripts()` only adds an entry to a registry that Thunderbird
checks when a compose window *opens*; it doesn't walk existing windows and
inject into them (confirmed by reading Thunderbird's own implementation in
`mail/components/extensions/parent/ext-scripting-tb.js`). There's no
supported API to inject into a compose editor that's already open, so if
you enable the addon (or reload it during development) while a compose
window is already open, that window won't get the ruler. Close and reopen
it, or start a new message, and it will.

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

Temporary add-ons are removed when Thunderbird restarts; reload via the
same debugging page when needed during development.
