// APP
// Thin controller: wires TRANSCRIPT + SUMMARIZER + UI together and
// owns the event listeners. Should stay free of extraction/rendering
// logic — if you find yourself adding real logic here, it probably
// belongs in one of the other modules.

import { TRANSCRIPT } from "./transcript.js";
import { SUMMARIZER } from "./summarizer.js";
import { GEMINI } from "./gemini.js";
import { UI } from "./ui.js";

export const APP = {
  // Picks Gemini when the user opted in and gave a key; otherwise
  // falls back to the local heuristic summarizer. Any Gemini failure
  // (bad key, quota, network) also falls back rather than failing
  // the whole run.
  async getSummary(transcript, mode) {
    const useGemini = UI.els.useGemini().checked;
    const apiKey = UI.els.geminiApiKey().value.trim();

    if (useGemini && apiKey) {
      try {
        return await GEMINI.summarize(transcript, mode, apiKey);
      } catch (err) {
        UI.setStatus(`Gemini error (${err.message}) — using local summary instead.`);
        return SUMMARIZER.summarize(transcript, mode);
      }
    }
    return SUMMARIZER.summarize(transcript, mode);
  },

  async run() {
    const input = UI.els.videoIds().value.trim();
    const mode = UI.els.summaryLength().value;

    UI.clearResults();
    UI.setStatus("Running...");

    const ids = TRANSCRIPT.parseIds(input);
    if (!ids.length) {
      UI.setStatus("Please paste at least one valid YouTube video ID.");
      return;
    }

    try {
      for (let i = 0; i < ids.length; i++) {
        const card = UI.addLoadingCard(i);
        const transcript = await TRANSCRIPT.fetch(ids[i]);
        const result = await this.getSummary(transcript, mode);
        UI.renderSummary(card, result);
      }
      UI.setStatus(`Done. Processed ${ids.length} video(s).`);
    } catch (err) {
      UI.setStatus(`Error: ${err.message}`);
    }
  },

  clearAll() {
    UI.clearInputs();
    UI.clearResults();
    UI.hideStatus();
  },

  init() {
    UI.els.summarizeBtn().addEventListener("click", () => this.run());
    UI.els.clearBtn().addEventListener("click", () => this.clearAll());

    // Gemini opt-in: reveal the key field, and persist the key locally
    // (this browser only — never written into the repo).
    const savedKey = UI.loadSavedApiKey();
    if (savedKey) {
      UI.els.geminiApiKey().value = savedKey;
      UI.els.useGemini().checked = true;
      UI.toggleGeminiKeyRow(true);
    }

    UI.els.useGemini().addEventListener("change", () => {
      UI.toggleGeminiKeyRow(UI.els.useGemini().checked);
    });

    UI.els.geminiApiKey().addEventListener("change", () => {
      UI.saveApiKey(UI.els.geminiApiKey().value.trim());
    });
  }
};

document.addEventListener("DOMContentLoaded", () => APP.init());
