// UI
// DOM rendering and escaping only. No business logic — this is
// where you'll work when redesigning the layout or card contents.

import { CONFIG } from "./config.js";

export const UI = {
  els: {
    videoIds: () => document.getElementById("videoIds"),
    summaryLength: () => document.getElementById("summaryLength"),
    status: () => document.getElementById("status"),
    results: () => document.getElementById("results"),
    summarizeBtn: () => document.getElementById("summarizeBtn"),
    clearBtn: () => document.getElementById("clearBtn"),
    useGemini: () => document.getElementById("useGemini"),
    geminiKeyRow: () => document.getElementById("geminiKeyRow"),
    geminiApiKey: () => document.getElementById("geminiApiKey")
  },

  loadSavedApiKey() {
    return localStorage.getItem(CONFIG.gemini.apiKeyStorageKey) || "";
  },

  saveApiKey(key) {
    localStorage.setItem(CONFIG.gemini.apiKeyStorageKey, key);
  },

  toggleGeminiKeyRow(show) {
    this.els.geminiKeyRow().style.display = show ? "block" : "none";
  },

  escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  },

  setStatus(text) {
    const status = this.els.status();
    status.style.display = "block";
    status.textContent = text;
  },

  hideStatus() {
    const status = this.els.status();
    status.style.display = "none";
    status.textContent = "";
  },

  clearResults() {
    this.els.results().innerHTML = "";
  },

  addLoadingCard(index) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<h3>Video ${index + 1}</h3><div class="summary">Loading...</div>`;
    this.els.results().appendChild(card);
    return card;
  },

  renderSummary(card, result) {
    const paragraphHtml = `<p>${this.escapeHtml(result.paragraph)}</p>`;
    let bulletsHtml = "";
    if (result.bullets && result.bullets.length > 0) {
      bulletsHtml = `
        <div class="key-points-label">Key Points</div>
        <ul class="key-points">
          ${result.bullets.map(b => `<li>${this.escapeHtml(b)}</li>`).join("")}
        </ul>
      `;
    }
    card.querySelector(".summary").innerHTML = paragraphHtml + bulletsHtml;
  },

  clearInputs() {
    this.els.videoIds().value = "";
  }
};
