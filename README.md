# ad-affiliate-remove

Chrome extension that detects and removes `yt-overlay-sticker` affiliate overlay elements from YouTube, captures them for review, and notifies you via a badge on the extension icon.

## Features

- Removes `yt-overlay-sticker` elements as soon as they appear (including dynamically injected ones)
- Captures each sticker's image, link, text, and page context before removing it
- Displays a red badge on the extension icon with the total count of removed stickers
- Click the extension icon to open a popup listing all removed stickers grouped by page
- Stickers with links are clickable — opens the affiliate URL in a new tab
- Clear button resets the list and the badge

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select this folder
5. Navigate to any YouTube page — the extension runs automatically

## Project structure

```
├── manifest.json   # Extension config (MV3), permissions, content script
├── background.js   # Service worker — manages the action badge
├── content.js      # Injected into YouTube — captures and removes stickers
├── popup.html      # Popup UI (dark theme)
└── popup.js        # Popup logic — reads storage, renders cards, handles clicks
```

## Permissions

| Permission | Why |
|---|---|
| `storage` | Persists captured stickers across page navigations |
| `tabs` | Opens affiliate links in a new tab from the popup |

## How it works

`content.js` runs a `MutationObserver` on `document.body` to catch elements injected after page load. When a `yt-overlay-sticker` is found, it extracts the image sources and the nearest `<a href>` link, saves the data to `chrome.storage.local`, removes the element from the DOM, and notifies the background service worker to update the badge count.
