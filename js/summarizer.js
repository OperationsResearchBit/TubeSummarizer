// SUMMARIZER
// Turns raw transcript text into { paragraph, bullets }. Depends
// only on NLP + CONFIG — no DOM, no network. This is the module
// you'll touch most when tuning summary quality.

import { NLP } from "./nlp.js";
import { CONFIG } from "./config.js";

export const SUMMARIZER = {
  templates: [
    t => `Highlights ${t} as a recurring theme throughout the video.`,
    t => `Explains how ${t} connects to the broader topic being discussed.`,
    t => `Offers practical takeaways related to ${t}.`,
    t => `Breaks down why ${t} matters in this context.`,
    t => `Draws a connection between ${t} and real-world application.`,
    t => `Provides additional perspective on ${t}.`
  ],

  clean(text) {
    return text
      .replace(/\[\d{1,2}:\d{2}(?::\d{2})?\]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, CONFIG.transcriptCharLimit);
  },

  // Splits ranked keywords into three non-overlapping tiers so the
  // paragraph doesn't repeat itself sentence to sentence.
  pickTiers(keywords, bigrams) {
    const primaryTopics = (bigrams.length > 0 ? bigrams.slice(0, 3) : keywords.slice(0, 3))
      .map(NLP.titleCase);
    const usedInPrimary = new Set(bigrams.slice(0, 3).flatMap(b => b.split(" ")).concat(keywords.slice(0, 3)));

    const secondaryRaw = keywords.filter(k => !usedInPrimary.has(k)).slice(0, 5);
    const secondaryKeywords = secondaryRaw.map(NLP.titleCase);
    const usedAfterSecondary = new Set([...usedInPrimary, ...secondaryRaw]);

    const thirdRaw = keywords.filter(k => !usedAfterSecondary.has(k)).slice(0, 4);
    const thirdSet = thirdRaw.map(NLP.titleCase);
    const usedAfterThird = new Set([...usedAfterSecondary, ...thirdRaw]);

    return { primaryTopics, secondaryKeywords, thirdSet, usedAfterThird };
  },

  buildParagraph({ primaryTopics, secondaryKeywords, thirdSet }, mode) {
    let summary = "In this video, the presenter explores " + NLP.joinList(primaryTopics);
    if (secondaryKeywords.length > 0) {
      summary += ", alongside key concepts such as " + NLP.joinList(secondaryKeywords);
    }
    summary += ".";

    if (mode === "short") return summary;

    summary += thirdSet.length > 0
      ? " The discussion also touches on " + NLP.joinList(thirdSet) + ", giving viewers a broader understanding of the subject matter."
      : " The content gives viewers a clear look at these topics and their practical significance.";

    if (mode === "standard") return summary;

    // long
    summary += " Overall, the video stays focused on the main ideas and connects them to useful context for the viewer.";
    return summary;
  },

  buildBullets({ primaryTopics, secondaryKeywords, usedAfterThird }, keywords, bigrams) {
    const leftoverBigrams = bigrams
      .filter(b => !b.split(" ").every(w => usedAfterThird.has(w)))
      .slice(3);
    const leftoverKeywords = keywords.filter(k => !usedAfterThird.has(k));

    const bulletTopics = [...leftoverBigrams, ...leftoverKeywords]
      .map(NLP.titleCase)
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .slice(0, CONFIG.bullets.max);

    let bullets = bulletTopics.map((topic, i) => this.templates[i % this.templates.length](topic));

    if (bullets.length < CONFIG.bullets.min) {
      const fallbackTopics = [...primaryTopics, ...secondaryKeywords]
        .filter((v, i, arr) => arr.indexOf(v) === i)
        .slice(0, CONFIG.bullets.min - bullets.length);
      fallbackTopics.forEach((topic, i) => {
        bullets.push(this.templates[(bullets.length + i) % this.templates.length](topic));
      });
    }

    return bullets.slice(0, CONFIG.bullets.max);
  },

  // Public entry point. Returns { paragraph: string, bullets: string[] }.
  // bullets is always [] for "short" and "standard".
  summarize(text, mode) {
    const cleaned = this.clean(text);
    const { keywords: kN, bigrams: bN } = CONFIG.pool[mode] || CONFIG.pool.standard;
    const keywords = NLP.topKeywords(cleaned, kN);
    const bigramList = NLP.bigrams(cleaned, bN);

    if (keywords.length === 0) {
      return {
        paragraph: "This video presents a discussion of the main ideas covered throughout the transcript.",
        bullets: []
      };
    }

    const tiers = this.pickTiers(keywords, bigramList);
    const paragraph = this.buildParagraph(tiers, mode);
    const bullets = mode === "long" ? this.buildBullets(tiers, keywords, bigramList) : [];

    return { paragraph, bullets };
  }
};
