import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import crypto from "node:crypto";
import { summarize } from "./summarize.js";

const app = express();
const allowed = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);

app.set("trust proxy", 1); // needed behind Render/Fly/Railway so rate limiting sees real IPs
app.use(cors({ origin: allowed.length ? allowed : false }));
app.use(express.json({ limit: "2mb" }));
app.use("/api", rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: true, legacyHeaders: false }));

// Tiny in-memory cache so re-running the same video doesn't cost twice.
const cache = new Map();
const CACHE_MAX = 200;

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/api/summarize", async (req, res) => {
  const { transcript, mode } = req.body || {};
  if (typeof transcript !== "string" || !transcript.trim()) {
    return res.status(400).json({ error: "transcript (string) is required" });
  }
  if (!["short", "standard", "long"].includes(mode)) {
    return res.status(400).json({ error: "mode must be short, standard, or long" });
  }

  const key = crypto.createHash("sha256").update(mode + "\n" + transcript).digest("hex");
  if (cache.has(key)) return res.json(cache.get(key));

  try {
    const result = await summarize(transcript, mode);
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
    cache.set(key, result);
    res.json(result);
  } catch (err) {
    console.error("summarize failed:", err?.status || "", err?.message);
    if (err?.status === 400 && err.message.includes("too short")) return res.status(400).json({ error: err.message });
    res.status(502).json({ error: "Summarization failed" });
  }
});

const port = process.env.PORT || 8787;
app.listen(port, () => console.log(`TubeSummarizer API on :${port}`));
