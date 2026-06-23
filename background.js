chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "STICKER_FOUND") {
    chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
    chrome.action.setBadgeText({ text: String(message.totalCount) });
  }

  if (message.type === "CLEAR_BADGE") {
    chrome.action.setBadgeText({ text: "" });
  }

  if (message.type === "EXTENSION_DISABLED") {
    chrome.action.setBadgeBackgroundColor({ color: "#555555" });
    chrome.action.setBadgeText({ text: "OFF" });
  }

  if (message.type === "EXTENSION_ENABLED") {
    chrome.storage.local.get("stickers", ({ stickers = [] }) => {
      if (stickers.length) {
        chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
        chrome.action.setBadgeText({ text: String(stickers.length) });
      } else {
        chrome.action.setBadgeText({ text: "" });
      }
    });
  }
});
