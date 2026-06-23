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

function attachCardListeners() {
  document.querySelectorAll(".sticker-card.clickable").forEach(card => {
    card.addEventListener("click", () => {
      chrome.tabs.create({ url: card.dataset.href });
    });
  });
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
        <div class="sticker-card${s.link ? " clickable" : ""}" ${s.link ? `data-href="${escHtml(s.link)}"` : ""}>
          ${s.images.length
            ? `<img class="sticker-thumb" src="${escHtml(s.images[0])}" alt="sticker">`
            : `<div class="sticker-placeholder">🏷️</div>`
          }
          <div class="sticker-info">
            <div class="sticker-page">${escHtml(group.pageTitle || "YouTube")}</div>
            <div class="sticker-time">${new Date(s.timestamp).toLocaleTimeString("pt-BR")}</div>
            ${s.text ? `<div class="sticker-text">${escHtml(s.text)}</div>` : ""}
            ${s.link ? `<div class="sticker-link">${escHtml(s.link)}</div>` : ""}
          </div>
          ${s.link ? `<span class="sticker-arrow">↗</span>` : ""}
        </div>
      `).join("")}
    </div>
  `).join("");

  attachCardListeners();
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
