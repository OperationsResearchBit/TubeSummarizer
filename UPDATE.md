# Update: v3, AI summarizer backend

This update replaces the in-browser Gemini call with a small backend (`server/`) that does the summarizing. The browser never sees an API key, and summaries are much better than the old extractive approach.

If the backend is unreachable, the app automatically falls back to the local extractive summarizer, so a run never fails outright.

---

## Why

| Problem in v2 | Fix in v3 |
|---|---|
| Local summarizer only read the first 15,000 characters (about 15 minutes) of a video | Truncation removed. The AI path reads the whole transcript |
| Auto-captions have no punctuation, so sentences over 45 words were dropped and many videos got the canned "This video presents a discussion…" line | Long unpunctuated runs are now split into ~25-word windows |
| Extractive summarization can only quote sentences. It cannot fix misheard words or skip sponsor reads | LLM summarization with a purpose-built prompt |
| API key was stored in the browser (`localStorage`) | Key lives on the server in `.env` |

---

## What's new

### Backend (`server/`)

- **Provider-agnostic.** Default is **Google Gemini (free tier, no credit card)**. Also supports any OpenAI-compatible API (Groq, OpenRouter, Ollama) and Anthropic. Switch with `LLM_PROVIDER` in `.env`.
- **Transcript cleaning** before the model sees it: removes timestamps, `[Music]`/`[Applause]` tags, `>>` speaker markers, "um/uh" filler, and the repeated lines auto-captions produce as the caption rolls.
- **Video title and channel as context.** Fetched from YouTube's public oEmbed endpoint so the model can fix misheard names and jargon. Best-effort: if the lookup fails, summarizing continues without it.
- **Plan, then write.** The model fills in a hidden `analysis` block (video type, thesis, key facts) before writing the summary. The analysis is discarded and never shown.
- **Type-aware prompt.** Different emphasis for tutorials, interviews, news, opinion, lectures, and reviews. Keeps hedges, preserves exact numbers, never opens with "This video…".
- **Automatic retry** if the result is generic (opens with "This video/The speaker" or uses "discusses/explores").
- **Long videos** (over 300,000 characters): a cheaper model takes notes on each chunk, then the main model summarizes the notes. Below that, the whole transcript goes in a single call.
- **Rate-limit handling:** automatic retry with backoff on 429/5xx from the provider.
- **Protection:** CORS allowlist, 20 requests/minute/IP, 2 MB body limit, in-memory cache (200 entries) so re-running a video is free.

### Frontend (`js/`)

- Added `api.js`, which calls the backend.
- Removed `gemini.js`, the API key field, and all `localStorage` key handling.
- `app.js` tries the backend first, then falls back to the local summarizer. It sends the video ID so the backend can look up the title.
- `nlp.js` / `summarizer.js`: local fallback no longer truncates and handles unpunctuated captions.

---

## Setup

Requires **Node 20.6 or newer**.

### 1. Get a free key

Create a Gemini API key at <https://aistudio.google.com/apikey>.

### 2. Start the backend

Windows (PowerShell):

```powershell
cd server
copy .env.example .env
notepad .env          # paste your key after LLM_API_KEY=
npm install
npm start
```

Mac / Linux:

```bash
cd server
cp .env.example .env
nano .env             # paste your key after LLM_API_KEY=
npm install
npm start
```

You should see `TubeSummarizer API on :8787`.

### 3. Start the frontend

From the repo root, in a second terminal:

```bash
python -m http.server 5500
```

Open <http://localhost:5500>. Don't open `index.html` by double-clicking: the app uses ES modules, which browsers block on `file://`, and the backend's CORS allowlist expects `localhost:5500`.

---

## Configuration (`server/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `LLM_PROVIDER` | `gemini` | `gemini`, `openai` (any OpenAI-compatible API), or `anthropic` |
| `LLM_API_KEY` | none | Provider API key (not needed for Ollama) |
| `LLM_BASE_URL` | provider default | Override the API URL, e.g. `http://localhost:11434/v1` for Ollama |
| `SUMMARY_MODEL` | `gemini-2.5-flash` | Model that writes the summary |
| `NOTES_MODEL` | `gemini-2.5-flash-lite` | Cheaper model for chunk notes on very long videos |
| `LLM_MAX_CHARS` | `300000` | Above this, use chunked notes. Lower it for small-context models |
| `LLM_CHUNK_CHARS` | `60000` | Chunk size for long videos |
| `NOTES_CONCURRENCY` | `2` | Parallel note-taking calls |
| `LLM_RETRY_MS` | `3000` | Base delay for 429/5xx retries |
| `ALLOWED_ORIGINS` | GitHub Pages + localhost:5500 | Comma-separated origins allowed to call the API |
| `PORT` | `8787` | Server port |

Other providers are documented in `server/.env.example`:

- **Groq** (free): `LLM_PROVIDER=openai`, your Groq key, and set `LLM_MAX_CHARS=24000`, `LLM_CHUNK_CHARS=16000`.
- **Ollama** (free, local): `LLM_PROVIDER=openai`, `LLM_BASE_URL=http://localhost:11434/v1`, `SUMMARY_MODEL=llama3.1:8b`.
- **Anthropic** (paid API, separate from a claude.ai subscription): `LLM_PROVIDER=anthropic`.

---

## API

### `POST /api/summarize`

```json
{ "transcript": "full transcript text", "mode": "short | standard | long", "videoId": "dQw4w9WgXcQ" }
```

`videoId` is optional (11 characters). When present, the title and channel are used as context.

Response:

```json
{ "paragraph": "…", "bullets": ["…", "…"] }
```

`bullets` is only populated in `long` mode.

| Status | Meaning |
|---|---|
| 400 | Bad `mode`, missing transcript, or transcript too short |
| 429 | Provider rate limit hit after retries |
| 502 | Provider error, including a rejected API key |

### `GET /health`

Returns `{ "ok": true }`.

---

## Deploying

1. Put `server/` on any Node host (Render, Fly.io, Railway). Set the environment variables from the table above in the host's dashboard. **Do not commit `.env`.**
2. Set `ALLOWED_ORIGINS` to your site's origin, e.g. `https://operationsresearchbit.github.io`.
3. In `js/config.js`, change `api.endpoint` to your deployed URL, e.g. `https://your-app.onrender.com/api/summarize`.
4. If you use a paid provider, set a monthly spend limit with that provider. Anyone who finds your endpoint can spend your credits. CORS and the rate limit only slow that down.

Add this to `.gitignore` if it isn't there already:

```
server/.env
server/node_modules/
```

---

## Known limitations

- **Free-tier limits.** Gemini's free tier has per-minute and per-day request caps that Google changes from time to time. The server retries on 429, but a run of 25 videos may still hit the cap. Check your current limits in Google AI Studio. Google may also use free-tier content to improve its products, which is fine for public transcripts.
- **Transcripts still come from a third-party service** (`youtube-transcript.ai`), fetched from the browser. A future change could move this to the backend.
- **The cache is in memory.** It resets when the server restarts.
- **The local fallback is a fallback.** On unpunctuated captions it returns phrase-length fragments rather than clean sentences, so it is noticeably weaker than the AI path.
- **Model names change.** If a provider retires a model, set `SUMMARY_MODEL` / `NOTES_MODEL` in `.env`.

---

## Files changed

```
server/                  NEW  Express backend
  index.js               routes, CORS, rate limit, cache, title lookup
  llm.js                 provider layer (Gemini / OpenAI-compatible / Anthropic)
  summarize.js           cleaning, prompt, planning, retry, chunking
  package.json
  .env.example
js/api.js                NEW  calls the backend
js/gemini.js             REMOVED
js/app.js                backend first, local fallback, passes video ID
js/config.js             api.endpoint replaces the gemini block
js/nlp.js                splits unpunctuated transcripts
js/summarizer.js         no longer truncates the transcript
js/ui.js                 API key handling removed
index.html               Gemini key UI removed
README.md                v3 setup section
UPDATE.md                this file
```
