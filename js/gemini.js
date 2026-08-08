// GEMINI
// Optional higher-quality summarizer backed by the Google Gemini API.
// Only called when the user has opted in and provided their own API
// key (see UI/app). Falls back to the local SUMMARIZER on any error
// — see APP.run().

import { CONFIG } from "./config.js";

export const GEMINI = {
  buildPrompt(transcript, mode) {
    const base = "You are summarizing a YouTube video transcript. Respond with ONLY valid JSON, no markdown code fences, no extra commentary.";

    if (mode === "short") {
      return `${base}\nTranscript:\n"""${transcript}"""\nReturn JSON exactly in this shape: {"paragraph": "<a 1-2 sentence summary>", "bullets": []}`;
    }
    if (mode === "standard") {
      return `${base}\nTranscript:\n"""${transcript}"""\nReturn JSON exactly in this shape: {"paragraph": "<a 2-3 sentence summary>", "bullets": []}`;
    }
    // long
    return `${base}\nTranscript:\n"""${transcript}"""\nReturn JSON exactly in this shape: {"paragraph": "<a 3-5 sentence summary covering the main narrative>", "bullets": ["<3 to 6 short, specific, non-redundant key points, each one sentence>"]}`;
  },

  async summarize(transcript, mode, apiKey) {
    if (!apiKey) throw new Error("No Gemini API key provided.");

    const cleaned = transcript.slice(0, CONFIG.gemini.transcriptCharLimit);
    const prompt = this.buildPrompt(cleaned, mode);
    const url = `${CONFIG.gemini.endpoint}${CONFIG.gemini.model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`Gemini API error (${res.status}): ${errBody.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned an empty response.");

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("Gemini response wasn't valid JSON.");
    }

    return {
      paragraph: typeof parsed.paragraph === "string" ? parsed.paragraph : "",
      bullets: Array.isArray(parsed.bullets) ? parsed.bullets.slice(0, 6).filter(b => typeof b === "string") : []
    };
  }
};
