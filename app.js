// APP
// Thin controller: wires TRANSCRIPT + SUMMARIZER + UI together and
// owns the event listeners. Should stay free of extraction/rendering
// logic — if you find yourself adding real logic here, it probably
// belongs in one of the other modules.

import { TRANSCRIPT } from "./transcript.js";
import { SUMMARIZER } from "./summarizer.js";
import { UI } from "./ui.js";

export const APP = {
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
        const result = SUMMARIZER.summarize(transcript, mode);
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
  }
};

document.addEventListener("DOMContentLoaded", () => APP.init());
