// NLP
// Tokenizing and keyword/bigram extraction. Pure functions — no
// knowledge of summary structure, the DOM, or app state. Safe to
// import into a standalone test script.

import { STOPWORDS } from "./stopwords.js";

export const NLP = {
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(w =>
        w.length > 3 &&
        !STOPWORDS.common.has(w) &&
        !STOPWORDS.boilerplate.has(w) &&
        !STOPWORDS.filler.has(w) &&
        !/\d/.test(w) &&              // drop tokens with digits (IDs, timestamps)
        !STOPWORDS.idLike.test(w)
      );
  },

  topKeywords(text, n) {
    const freq = {};
    for (const w of this.tokenize(text)) freq[w] = (freq[w] || 0) + 1;
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([w]) => w);
  },

  bigrams(text, maxCount) {
    const words = this.tokenize(text);
    const freq = {};
    for (let i = 0; i < words.length - 1; i++) {
      const bg = words[i] + " " + words[i + 1];
      freq[bg] = (freq[bg] || 0) + 1;
    }
    return Object.entries(freq)
      .filter(([, c]) => c > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxCount)
      .map(([p]) => p);
  },

  titleCase(str) {
    return str.replace(/\b\w/g, c => c.toUpperCase());
  },

  joinList(items) {
    if (items.length === 0) return "";
    if (items.length === 1) return items[0];
    if (items.length === 2) return items[0] + " and " + items[1];
    return items.slice(0, -1).join(", ") + ", and " + items[items.length - 1];
  }
};
