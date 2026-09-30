// CONFIG
// All tunable numbers/strings live here. Change pool sizes, the
// transcript API endpoint, or bullet count limits without touching
// any logic in the other modules.

export const CONFIG = {
  maxVideos: 25,
  transcriptBase: "https://youtube-transcript.ai/transcript/",
  bullets: { min: 3, max: 6 },
  api: {
    // Change to your deployed backend URL (e.g. https://tubesummarizer.onrender.com/api/summarize)
    endpoint: "http://localhost:8787/api/summarize",
    timeoutMs: 120000
  }
};
