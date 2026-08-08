// NLP
// Tokenizing, word-frequency scoring, sentence splitting, and
// diversity-aware sentence selection. Pure functions — no knowledge
// of summary structure, the DOM, or app state. Safe to import into
// a standalone test script.

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

  // Frequency of each significant word across the whole transcript.
  // This is the classic Luhn-style "word significance" score: words
  // that show up often are assumed to carry the transcript's topics.
  wordFrequencies(text) {
    const freq = {};
    for (const w of this.tokenize(text)) freq[w] = (freq[w] || 0) + 1;
    return freq;
  },

  // Naive sentence splitter tuned for spoken transcript text (no
  // reliable paragraph breaks, lots of run-ons). Good enough without
  // pulling in a full NLP library.
  splitSentences(text) {
    return text
      .replace(/([.!?])\s+/g, "$1|")
      .split("|")
      .map(s => s.trim())
      .filter(Boolean);
  },

  // A sentence stuffed with link/CTA boilerplate ("click the link in
  // the description and subscribe") shouldn't be eligible for
  // extraction even if some of its other words score high.
  isBoilerplateSentence(sentence) {
    const lower = sentence.toLowerCase();
    let hits = 0;
    for (const w of STOPWORDS.boilerplate) {
      if (lower.includes(w)) hits++;
      if (hits >= 2) return true;
    }
    return false;
  },

  // Candidate sentences: not too short (usually filler like "Right,
  // okay."), not too long (usually a transcription run-on that's
  // hard to read out of context), not boilerplate, and not mostly
  // filler words ("Um, so like, yeah, kind of interesting I guess"
  // has plenty of words but almost no actual content).
  candidateSentences(text) {
    return this.splitSentences(text).filter(s => {
      const totalWords = s.split(/\s+/).filter(Boolean).length;
      if (totalWords < 6 || totalWords > 45) return false;
      if (this.isBoilerplateSentence(s)) return false;
      const contentWords = this.tokenize(s).length;
      return contentWords / totalWords >= 0.3;
    });
  },

  // Score = average per-word significance, normalized by sentence
  // length so long sentences don't win purely on word volume.
  scoreSentences(sentences, freq) {
    return sentences.map((sentence, index) => {
      const words = this.tokenize(sentence);
      const totalWords = sentence.split(/\s+/).filter(Boolean).length;
      const score = totalWords === 0 || words.length === 0
        ? 0
        : words.reduce((sum, w) => sum + (freq[w] || 0), 0) / totalWords;
      return { sentence, index, score, words: new Set(words) };
    });
  },

  overlapRatio(setA, setB) {
    if (setA.size === 0) return 0;
    let shared = 0;
    for (const w of setA) if (setB.has(w)) shared++;
    return shared / setA.size;
  },

  // Greedy diversity-aware pick (a lightweight MMR): take the
  // highest-scoring sentence, then keep taking the next highest as
  // long as it doesn't just re-say something already picked.
  // overlapThreshold is relaxed by the caller if too few sentences
  // qualify (e.g. a short or repetitive transcript).
  selectDiverse(scored, n, alreadyUsedWordSets = [], overlapThreshold = 0.55) {
    const usedWords = new Set(alreadyUsedWordSets.flatMap(s => [...s]));
    const pool = [...scored].sort((a, b) => b.score - a.score);
    const chosen = [];

    for (const candidate of pool) {
      if (chosen.length >= n) break;
      if (this.overlapRatio(candidate.words, usedWords) > overlapThreshold) continue;
      chosen.push(candidate);
      for (const w of candidate.words) usedWords.add(w);
    }
    return chosen;
  },

  tidySentence(sentence) {
    let t = sentence.trim().replace(/\s+/g, " ");
    if (!/[.!?]$/.test(t)) t += ".";
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
};
