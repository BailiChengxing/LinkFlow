# LinkFlow

> A lightweight, privacy-focused browser extension for extracting and cleaning URLs from unstructured text.

[简体中文](README.zh-CN.md) | **English**

![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue.svg)
![Platforms](https://img.shields.io/badge/Platforms-Chrome%20%7C%20Edge%20%7C%20Firefox-orange.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

## Features

- **URL extraction:** Find, normalize, and deduplicate HTTP/HTTPS links in pasted text.
- **Custom matching:** Edit the JavaScript regular expression and flags, or restore the built-in default.
- **Text cleanup:** Remove configured Unicode character ranges and optionally strip the contents of selected brackets, angle brackets, braces, book-title marks, and quote pairs before matching.
- **Connectivity checks:** Optionally check extracted links and show their connection status. Configure the maximum number of concurrent checks. When enabled, the extension requests optional access to all HTTP/HTTPS websites.
- **Popup content retention:** Keep the original input and extracted links between popup openings, delete them when the browser closes, or clear them after each use.
- **Right-click extraction:** Optionally enable a selection context-menu command to open LinkFlow and extract links from selected text immediately.
- **Clipboard input:** Read clipboard text directly from the popup.
- **Themes and localization:** 15 interface languages, plus light, dark, and browser-following themes.
- **Private by design:** Matching and cleanup run locally. Connectivity checks contact the URLs you choose to test; input text and extracted links are not uploaded to a LinkFlow server.
- **Browser support:** Chromium-based browsers (Chrome, Edge, Brave) and Firefox desktop/Android.
- **No build step or third-party runtime dependencies.**

## Install

### Chrome, Edge, or Brave

Install the published extension from [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/gbfnjfjmjijdngcikfldgmkamhcjcmnm), or load it unpacked using the steps below.

1. Download or clone this repository.
2. Open `chrome://extensions/` (or the browser's extensions page).
3. Enable **Developer mode**.
4. Select **Load unpacked** and choose the repository directory.

### Firefox desktop

Install the published extension from [Firefox Add-ons](https://addons.mozilla.org/zh-CN/firefox/addon/%E6%B8%85%E9%93%BE%E5%8A%A9%E6%89%8B/), or load it temporarily using the steps below.

Firefox uses its own Manifest V3 background-script format. With Node.js installed, run `node build-firefox.mjs` from the repository directory, then load `.build/firefox/manifest.json` as the temporary add-on.

1. Open `about:debugging#/runtime/this-firefox`.
2. Choose **Load Temporary Add-on…**.
3. Select `.build/firefox/manifest.json`.

For Firefox Android, install the published add-on from [Firefox Add-ons](https://addons.mozilla.org/) when available for your device.

## Usage

1. Open LinkFlow and paste text or use **Read Clipboard**.
2. Select **Extract All Links** to display the cleaned, deduplicated URLs.
3. Open **Settings** to configure matching, cleanup, language, theme, and connectivity checks.

To extract from selected text on a webpage, enable **Settings → More → Right-click menu**. Select text, right-click, and choose **Extract links with LinkFlow**.

### Connectivity checks and permissions

Connectivity checks are off by default. Open **Settings → More → Link validity test**, enable the feature, and choose a concurrency value. Enabling it prompts for optional access to all HTTP/HTTPS websites; this permission is used to send requests to the extracted URLs so the browser can report whether an HTTP response was received. Checks run only after extraction and only when the feature is enabled. A timeout or blocked request is reported as unreachable; server responses include their HTTP status. A website can be reachable while a particular page returns an error status.

In **Settings → More → Retention period**, choose whether the popup keeps its original input and extracted links indefinitely, deletes them when the browser closes, or deletes them after each use. The default is to delete them when the browser closes.

### Link validity test

The **Link validity test** is a quick per-link check that helps you tell whether an extracted URL is actually usable. After extraction, each URL can be tested individually. When enabled, the popup marks each result with a status such as **Valid** or **No response** so you can quickly spot dead, blocked, or invalid links before opening them.

This test is optional and disabled by default. When you enable it, LinkFlow requests the browser's optional site access permission for HTTP/HTTPS pages and sends lightweight requests to the extracted links. The testing process is limited by the configured concurrency value to avoid too many simultaneous requests, and the badge shown next to each result makes the outcome easy to scan at a glance.

### Cleanup rules

In **Settings → General**, configure Unicode ranges and bracket/quote pairs. The built-in character cleanup starts with Chinese characters enabled. Add, edit, or remove ranges as needed. Bracket cleanup is individually selectable and removes a matched pair together with the content inside it.

## Privacy

LinkFlow stores preferences in the browser's local storage. It does not send pasted text or settings to a LinkFlow backend. If connectivity checks are enabled, the browser sends requests to the extracted URLs; those sites may receive the request and its normal network metadata. Disable the feature or revoke the optional site permission in your browser's extension settings to stop checks.

## Project layout

| Path | Purpose |
| --- | --- |
| `manifest.json` | WebExtension Manifest V3 metadata and permissions |
| `popup.html`, `popup.js` | Popup interface and URL extraction/checking |
| `settings.html`, `settings.js` | Preferences and configuration |
| `background.js` | Selection context-menu registration and handling |
| `manifest.firefox.json`, `build-firefox.mjs` | Firefox-compatible manifest and packaging helper |
| `theme.js`, `i18n.js` | Shared theme and localization helpers |
| `locales/` | Interface translations; `supplemental.json` contains translations that extend incomplete locale packs |
| `_locales/` | Browser-managed extension name and description translations |

## Development

This is a dependency-free HTML/CSS/JavaScript extension; no compilation is required. To test changes, load the repository as an unpacked extension and reload it from the browser's extensions page.

## License

Released under the [MIT License](LICENSE).
