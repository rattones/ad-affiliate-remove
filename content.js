let pendingStickers = [];
let debounceTimer = null;
let observer = null;

async function sha1(str) {
  const buffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-1", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function captureSticker(el) {
  const images = [...el.querySelectorAll("img")].map(img => img.src).filter(Boolean);
  const anchor = el.querySelector("a[href]") || el.closest("a[href]");
  const rawHref = anchor ? anchor.getAttribute("href") : null;
  const link = rawHref && !rawHref.startsWith("about:") ? rawHref : null;

  return {
    images,
    link,
    text: el.textContent.trim(),
    html: el.outerHTML,
    url: window.location.href,
    pageTitle: document.title,
    timestamp: Date.now()
  };
}

async function processQueue() {
  if (!pendingStickers.length) return;
  const batch = pendingStickers.splice(0);

  const withHashes = await Promise.all(
    batch.map(async s => ({ ...s, hash: await sha1(s.url) }))
  );

  chrome.storage.local.get("stickers", ({ stickers = [] }) => {
    const seen = new Set(stickers.map(s => s.hash));
    const newOnes = withHashes.filter(s => {
      if (seen.has(s.hash)) return false;
      seen.add(s.hash);
      return true;
    });

    if (!newOnes.length) return;

    const updated = [...stickers, ...newOnes];
    chrome.storage.local.set({ stickers: updated });
    chrome.runtime.sendMessage({ type: "STICKER_FOUND", totalCount: updated.length });
  });
}

function removeOverlayStickers() {
  document.querySelectorAll("yt-overlay-sticker").forEach(el => {
    console.log(el);
    pendingStickers.push(captureSticker(el));
    el.remove();
  });

  if (pendingStickers.length > 0) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(processQueue, 150);
  }
}

function startObserver() {
  if (observer) return;
  removeOverlayStickers();
  observer = new MutationObserver(() => removeOverlayStickers());
  observer.observe(document.body, { childList: true, subtree: true });
}

function stopObserver() {
  if (!observer) return;
  observer.disconnect();
  observer = null;
}

// Observa mudanças no DOM para remover elementos carregados dinamicamente
chrome.storage.local.get("enabled", ({ enabled = true }) => {
  if (enabled) startObserver();
});

chrome.storage.onChanged.addListener(({ enabled }) => {
  if (enabled === undefined) return;
  enabled.newValue ? startObserver() : stopObserver();
});
