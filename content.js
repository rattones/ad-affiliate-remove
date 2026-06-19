let pendingStickers = [];
let debounceTimer = null;

function captureSticker(el) {
  const images = [...el.querySelectorAll("img")].map(img => img.src).filter(Boolean);

  // Procura o link dentro do sticker ou no elemento pai mais próximo
  const anchor = el.querySelector("a[href]") || el.closest("a[href]");
  const link = anchor ? anchor.href : null;

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

function processQueue() {
  if (!pendingStickers.length) return;
  const batch = [...pendingStickers];
  pendingStickers = [];

  chrome.storage.local.get("stickers", ({ stickers = [] }) => {
    const updated = [...stickers, ...batch];
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

removeOverlayStickers();

// Observa mudanças no DOM para remover elementos carregados dinamicamente
const observer = new MutationObserver(() => {
  removeOverlayStickers();
});

observer.observe(document.body, { childList: true, subtree: true });
