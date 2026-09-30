// API
// Calls the TubeSummarizer backend (server/), which holds the Claude
// API key. No key ever touches the browser.

import { CONFIG } from "./config.js";

export const API = {
  async summarize(transcript, mode) {
    const res = await fetch(CONFIG.api.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, mode }),
      signal: AbortSignal.timeout(CONFIG.api.timeoutMs)
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    const data = await res.json();
    if (!data.paragraph) throw new Error("Empty summary");
    return { paragraph: data.paragraph, bullets: data.bullets || [] };
  }
};
