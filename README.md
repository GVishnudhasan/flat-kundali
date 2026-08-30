# फ्लैट कुंडली · Flat Kundali

**Match your kundali with a flat's — agentic due-diligence for Bengaluru rentals.**

Indians match kundalis before a marriage. This app matches one before your next
flat: seven parallel agents read the live web — water reality, commute, society
reputation, price fairness, red flags, livability, and the fine print of your
rent agreement — score each "house" against *your* life, and deliver a spoken
verdict in your language before you sign the lease.

Built in 90 minutes for the **AI Engineer Mixer build sprint** (Sarvam.ai × Anakin.io).

## The flow

1. Paste a listing URL (NoBroker / 99acres / MagicBricks) — or speak it.
2. Speak your life in one line, Hinglish welcome:
   *"Main Whitefield mein kaam karta hoon, do din WFH, ek dog hai, budget 30k."*
3. Optionally attach the 11-month rent agreement PDF.
4. Watch the kundali draw itself as seven agents complete, house by house.
5. Get a **guna score /36**, per-house live evidence with sources, and a
   **spoken Hindi verdict** you can play to your parents.

## Where the sponsor APIs are load-bearing

| Stage | API |
|---|---|
| Voice intake (code-mixed Hinglish) | **Sarvam** Saarika STT |
| Profile & listing parsing, per-house scoring, final matchmaking | **Sarvam-M** reasoning (strict-JSON contracts) |
| Kannada news/review sources → English mid-pipeline | **Sarvam** Translate |
| Rent-agreement clause extraction (7th house) | **Sarvam** Document AI (Parse) |
| Spoken verdict | **Sarvam** Bulbul TTS |
| Listing page → structured data | **Anakin** URL Scraper |
| Six live evidence searches per run (water/commute/society/price/flags/livability) | **Anakin** Search API |

## Run it

```bash
npm install
cp .env.example .env.local   # add SARVAM_API_KEY + ANAKIN_API_KEY
npm run dev                  # http://localhost:3000
```

**No keys? It still demos.** With keys absent (or `MOCK=1`) the server replays a
scripted, realistic run (Sobha Dream Acres, Panathur) through the same SSE
pipeline — pixel-identical UI, no network needed. The spoken verdict falls back
to browser TTS in mock mode.

**Demo insurance:** every successful live run is recorded to `.cache/` and
replayed instantly (with natural pacing) if the same URL is analyzed again —
podium-wifi-proof.

## Architecture

Two API routes, one screen.

- `POST /api/transcribe` — audio → Sarvam STT → text.
- `POST /api/analyze` — SSE stream. Intake (Sarvam-M) → listing scrape (Anakin)
  → `Promise.allSettled` fan-out of 6 search+scrape+score agents plus the
  agreement parser → synthesis → translate → TTS. Each stage emits typed events
  (`house_running`, `house_complete`, `house_failed`, `verdict`); the kundali
  SVG fills as they arrive. A failed house degrades to "unverified" with a
  manual search link — the run never dies.

## Example input for judges

- Listing: click **"Try the example"** (pre-cached), or paste any live listing URL.
- Profile: hold the mic and say the Hinglish sentence above.

## Limitations

- Anakin/Sarvam endpoint field names verified against docs on sprint day;
  clients are isolated in `lib/sarvam.ts` / `lib/anakin.ts`.
- Evidence quality depends on what the live web has for a given society.
- Next steps: two-flat gun-milan comparison, Anakin Wire structured actions
  (site-visit booking), price monitoring.
