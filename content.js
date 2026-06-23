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

function captureProduct(el) {
  const titleEl  = el.querySelector("#product-title");
  const merchantEl = el.querySelector("#merchant-name");
  const priceEl  = el.querySelector("#product-price, #product-price-replacement");
  const imgEl    = el.querySelector("img#img");
  const linkEl   = el.querySelector("a#container");

  const rawHref = linkEl ? linkEl.getAttribute("href") : null;
  const link = rawHref && !rawHref.startsWith("about:") ? rawHref : null;

  // img.src resolves to page URL when src=""; use getAttribute to detect empty
  const rawSrc = imgEl ? imgEl.getAttribute("src") : null;
  const image = rawSrc ? imgEl.src : null;

  return {
    title:    titleEl    ? titleEl.textContent.trim()    : null,
    merchant: merchantEl ? merchantEl.textContent.trim() : null,
    price:    priceEl    ? priceEl.textContent.trim()    : null,
    image,
    link
  };
}

function captureSticker(el) {
  // Prefer the "actual" image (not shadow copies); fall back to any img with a real src
  const mainImgEl = el.querySelector("img.ytImageStickerImageActual")
    || [...el.querySelectorAll("img")].find(img => img.getAttribute("src"));
  const rawSrc   = mainImgEl ? mainImgEl.getAttribute("src") : null;
  const mainImage = rawSrc ? mainImgEl.src : null;
  const mainTitle = mainImgEl ? mainImgEl.alt : null;

  // One-product: anchor has the real affiliate URL
  // Multiple-products: anchor href is "about:invalid#zClosurez"
  const anchor  = el.querySelector("a.ytOverlayProductStickerImageContainer");
  const rawHref = anchor ? anchor.getAttribute("href") : null;
  const link    = rawHref && !rawHref.startsWith("about:") ? rawHref : null;

  // Multiple-product stickers: product list lives in a separate DOM panel
  const products = link
    ? []
    : [...document.querySelectorAll("ytd-product-list-item-renderer")].map(captureProduct);

  return {
    mainImage,
    mainTitle,
    link,
    products,
    url:       window.location.href,
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
    console.log("stickers: ", JSON.stringify(stickers));
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

chrome.storage.local.get("enabled", ({ enabled = true }) => {
  if (enabled) startObserver();
});

chrome.storage.onChanged.addListener(({ enabled }) => {
  if (enabled === undefined) return;
  enabled.newValue ? startObserver() : stopObserver();
});
