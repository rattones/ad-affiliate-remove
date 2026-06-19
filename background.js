chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "STICKER_FOUND") {
    chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
    chrome.action.setBadgeText({ text: String(message.totalCount) });
  }

  if (message.type === "CLEAR_BADGE") {
    chrome.action.setBadgeText({ text: "" });
  }
});
