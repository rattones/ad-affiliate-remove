document.addEventListener("DOMContentLoaded", () => {
  loadStickers();
  loadToggleState();

  document.getElementById("clearBtn").addEventListener("click", () => {
    chrome.storage.local.set({ stickers: [] }, () => {
      chrome.runtime.sendMessage({ type: "CLEAR_BADGE" });
      loadStickers();
    });
  });

  document.getElementById("toggleBtn").addEventListener("change", (e) => {
    const enabled = e.target.checked;
    chrome.storage.local.set({ enabled }, () => {
      updateToggleLabel(enabled);
      chrome.runtime.sendMessage({
        type: enabled ? "EXTENSION_ENABLED" : "EXTENSION_DISABLED"
      });
    });
  });
});

function loadToggleState() {
  chrome.storage.local.get("enabled", ({ enabled = true }) => {
    document.getElementById("toggleBtn").checked = enabled;
    updateToggleLabel(enabled);
  });
}

function updateToggleLabel(enabled) {
  document.getElementById("toggleLabel").textContent = enabled ? "ON" : "OFF";
}

function loadStickers() {
  chrome.storage.local.get("stickers", ({ stickers = [] }) => {
    renderStickers(stickers);
  });
}

function groupByUrl(stickers) {
  return stickers.reduce((acc, s) => {
    if (!acc[s.url]) acc[s.url] = { url: s.url, pageTitle: s.pageTitle, items: [] };
    acc[s.url].items.push(s);
    return acc;
  }, {});
}

function renderProducts(products) {
  if (!products || !products.length) return "";

  const label = `${products.length} produto${products.length !== 1 ? "s" : ""}`;

  const items = products.map(p => `
    <div class="product-item${p.link ? " clickable" : ""}"
         ${p.link ? `data-href="${escHtml(p.link)}"` : ""}>
      ${p.image
        ? `<img class="product-thumb" src="${escHtml(p.image)}" alt="">`
        : `<div class="product-thumb-placeholder"></div>`
      }
      <div class="product-info">
        <div class="product-title">${escHtml(p.title || "Produto")}</div>
        ${(p.merchant || p.price) ? `
          <div class="product-meta">
            ${[p.merchant, p.price].filter(Boolean).map(escHtml).join(" · ")}
          </div>` : ""}
      </div>
      ${p.link ? `<span class="arrow">↗</span>` : ""}
    </div>
  `).join("");

  return `
    <details class="products">
      <summary>${label}</summary>
      <div class="product-list">${items}</div>
    </details>`;
}

function renderStickers(stickers) {
  const container = document.getElementById("stickers");

  if (!stickers.length) {
    container.innerHTML = '<p class="empty">Nenhum sticker encontrado nesta sessão.</p>';
    return;
  }

  const grouped = groupByUrl(stickers);

  container.innerHTML = Object.values(grouped).map(group => `
    <div class="group">
      <div class="group-header" title="${escHtml(group.url)}">
        ${escHtml(group.pageTitle || group.url)}
      </div>
      ${group.items.map(s => `
        <div class="sticker-card">
          <div class="sticker-main${s.link ? " clickable" : ""}"
               ${s.link ? `data-href="${escHtml(s.link)}"` : ""}>
            ${s.mainImage
              ? `<img class="sticker-thumb" src="${escHtml(s.mainImage)}" alt="">`
              : `<div class="sticker-placeholder">🏷️</div>`
            }
            <div class="sticker-info">
              <div class="sticker-page">${escHtml(group.pageTitle || "YouTube")}</div>
              <div class="sticker-time">${new Date(s.timestamp).toLocaleTimeString("pt-BR")}</div>
              ${s.mainTitle ? `<div class="sticker-title">${escHtml(s.mainTitle)}</div>` : ""}
              ${s.link ? `<div class="sticker-link">${escHtml(s.link)}</div>` : ""}
            </div>
            ${s.link ? `<span class="arrow">↗</span>` : ""}
          </div>
          ${renderProducts(s.products)}
        </div>
      `).join("")}
    </div>
  `).join("");

  attachListeners();
}

function attachListeners() {
  document.querySelectorAll(".sticker-main.clickable, .product-item.clickable").forEach(el => {
    el.addEventListener("click", () => chrome.tabs.create({ url: el.dataset.href }));
  });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
