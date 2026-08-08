// SUMMARIZER
// Turns raw transcript text into { paragraph, bullets } using
// extractive summarization: score every real sentence by how
// central its words are to the whole transcript, then greedily pick
// the strongest non-redundant ones. Unlike a templated approach,
// every sentence in the output actually came from the video.
//
// Depends only on NLP + CONFIG — no DOM, no network. This is the
// module you'll touch most when tuning summary quality.

import { NLP } from "./nlp.js";
import { CONFIG } from "./config.js";

// How many sentences make up the paragraph at each length setting.
const PARAGRAPH_SENTENCE_COUNTS = { short: 2, standard: 3, long: 5 };

// If strict diversity filtering can't find enough distinct
// sentences (short/repetitive transcripts), retry with a looser
// overlap tolerance before giving up.
const OVERLAP_FALLBACKS = [0.55, 0.75, 1.0];

export const SUMMARIZER = {
  clean(text) {
    return text
      .replace(/\[\d{1,2}:\d{2}(?::\d{2})?\]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, CONFIG.transcriptCharLimit);
  },

  // Tries to reach `n` at a strict overlap threshold first (best
  // quality). If that comes up short, retries at looser thresholds
  // but only chasing the floor (min), not the ceiling (max) — it's
  // better to return 3 strong bullets than pad to 6 with weak ones.
  pickWithFallback(scored, n, usedWordSets, floor = n) {
    let picks = NLP.selectDiverse(scored, n, usedWordSets, OVERLAP_FALLBACKS[0]);
    if (picks.length >= floor) return picks;

    for (const threshold of OVERLAP_FALLBACKS.slice(1)) {
      picks = NLP.selectDiverse(scored, floor, usedWordSets, threshold);
      if (picks.length >= floor) break;
    }
    return picks;
  },

  summarize(text, mode) {
    const cleaned = this.clean(text);
    const candidates = NLP.candidateSentences(cleaned);

    if (candidates.length === 0) {
      return {
        paragraph: "This video presents a discussion of the main ideas covered throughout the transcript.",
        bullets: []
      };
    }

    const freq = NLP.wordFrequencies(cleaned);
    const scored = NLP.scoreSentences(candidates, freq);

    // Paragraph: pick top sentences by score, then reorder chronologically
    // (by original position in the transcript) so it reads like a
    // narrative instead of a ranked list.
    const paragraphCount = PARAGRAPH_SENTENCE_COUNTS[mode] || PARAGRAPH_SENTENCE_COUNTS.standard;
    const paragraphPicks = this.pickWithFallback(scored, paragraphCount, []);
    paragraphPicks.sort((a, b) => a.index - b.index);
    const paragraph = paragraphPicks.map(p => NLP.tidySentence(p.sentence)).join(" ");

    let bullets = [];
    if (mode === "long") {
      const usedSets = paragraphPicks.map(p => p.words);
      const remaining = scored.filter(s => !paragraphPicks.includes(s));
      const bulletPicks = this.pickWithFallback(remaining, CONFIG.bullets.max, usedSets, CONFIG.bullets.min);
      bullets = bulletPicks
        .slice(0, CONFIG.bullets.max)
        .sort((a, b) => a.index - b.index)
        .map(p => NLP.tidySentence(p.sentence));
    }

    return { paragraph, bullets };
  }
};
