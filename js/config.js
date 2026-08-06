// CONFIG
// All tunable numbers/strings live here. Change pool sizes, the
// transcript API endpoint, or bullet count limits without touching
// any logic in the other modules.

export const CONFIG = {
  maxVideos: 25,
  transcriptBase: "https://youtube-transcript.ai/transcript/",
  transcriptCharLimit: 15000,
  pool: {
    short:    { keywords: 20, bigrams: 5 },
    standard: { keywords: 20, bigrams: 5 },
    long:     { keywords: 32, bigrams: 10 }
  },
  bullets: { min: 3, max: 6 }
};
