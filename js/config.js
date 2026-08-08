// CONFIG
// All tunable numbers/strings live here. Change pool sizes, the
// transcript API endpoint, or bullet count limits without touching
// any logic in the other modules.

export const CONFIG = {
  maxVideos: 25,
  transcriptBase: "https://youtube-transcript.ai/transcript/",
  transcriptCharLimit: 15000,
  bullets: { min: 3, max: 6 },
  gemini: {
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models/",
    // If Google renames/retires this model, this is the only line to change.
    model: "gemini-2.0-flash",
    transcriptCharLimit: 30000,
    apiKeyStorageKey: "playlistSummarizer_geminiApiKey"
  }
};
