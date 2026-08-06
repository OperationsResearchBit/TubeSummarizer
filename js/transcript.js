// TRANSCRIPT
// The only module that talks to the network or parses raw user
// input into video IDs.

import { CONFIG } from "./config.js";

export const TRANSCRIPT = {
  parseIds(text) {
    return [...new Set(
      text.split(/[\s,]+/g)
        .map(s => s.trim())
        .filter(Boolean)
        .filter(s => /^[a-zA-Z0-9_-]{11}$/.test(s))
    )].slice(0, CONFIG.maxVideos);
  },

  async fetch(videoId) {
    const url = `${CONFIG.transcriptBase}${encodeURIComponent(videoId)}.txt`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Transcript unavailable");
    return await res.text();
  }
};
