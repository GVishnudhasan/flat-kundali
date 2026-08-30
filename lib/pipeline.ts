// The live agentic pipeline: intake → listing → 7-house fan-out → synthesis.
// Emits AnalyzeEvent objects through the provided callback (wired to SSE).

import * as sarvam from "./sarvam";
import * as anakin from "./anakin";
import type { AnalyzeEvent, AnalyzeRequest, HouseKey, HouseResult, Listing } from "./types";

type Emit = (e: AnalyzeEvent) => void;

interface Profile {
  office: string;
  budget: number | null;
  pets: boolean;
  family: string;
  language: string; // BCP-47 like "hi-IN"
}

const HOUSE_QUERIES: Record<
  Exclude<HouseKey, "agreement">,
  (l: Listing, p: Profile) => string
> = {
  water: (l) => `${l.locality} water shortage tanker borewell Cauvery supply`,
  commute: (l, p) => `${l.locality} to ${p.office || "city center"} commute traffic time`,
  society: (l) => `"${l.society}" resident reviews complaints maintenance`,
  price: (l) => `${l.society} ${l.locality} ${l.bhk} rent price comparison`,
  redflags: (l) => `"${l.society}" OR "${l.locality}" scam waterlogging litigation dispute`,
  livability: (l) => `${l.locality} restaurants parks gyms walkability daily life`,
};

// Generous: each house does search + job-polled scrape + reasoning-model
// scoring, and concurrent chat calls queue on hackathon-tier API keys.
const HOUSE_TIMEOUT_MS = 150_000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
  ]);
}

const looksKannada = (s: string) => /[ಀ-೿]/.test(s);

async function runHouse(
  house: Exclude<HouseKey, "agreement">,
  listing: Listing,
  profile: Profile,
  emit: Emit
): Promise<HouseResult> {
  const query = HOUSE_QUERIES[house](listing, profile);
  emit({ type: "agent_log", message: `Anakin · search: "${query}"`, tone: "search" });
  const results = await anakin.search(query, 4);

  // Scrape the top result for depth; keep the rest as snippet evidence.
  let scraped = "";
  if (results[0]?.url) {
    emit({ type: "agent_log", message: `Anakin · scraping ${new URL(results[0].url).hostname}…`, tone: "scrape" });
    // Cap the scrape so a slow site can't eat the house's whole budget,
    // and keep the excerpt small — reasoning latency scales with input.
    scraped = (await anakin.scrape(results[0].url, 15_000).catch(() => "")).slice(0, 2500);
  }
  if (looksKannada(scraped)) {
    emit({ type: "agent_log", message: "Sarvam Translate · Kannada source → English", tone: "translate" });
    scraped = await sarvam.translate(scraped.slice(0, 1800), "en-IN").catch(() => scraped);
  }

  const evidencePool = results
    .map((r, i) => `[${i}] ${r.title} (${r.url})\n${r.snippet ?? ""}`)
    .join("\n\n");

  return sarvam.chatJSON<HouseResult>(
    `You are one dimension-agent of a flat-rental due-diligence system for Bengaluru.
Score the "${house}" dimension from 0 (terrible) to 6 (excellent) FOR THIS SPECIFIC TENANT.
Tenant profile: ${JSON.stringify(profile)}.
Return JSON: {"house":"${house}","score":<0-6>,"verdict_one_line":"<max 140 chars, concrete facts>","evidence":[{"quote":"<short verbatim quote>","source_name":"<publication>","url":"<url>"}],"dealbreaker":<true if this alone should stop the tenant>}.
Max 2 evidence items. Only use provided material; if evidence is thin, score conservatively and say so.`,
    `LISTING: ${JSON.stringify(listing)}\n\nSEARCH RESULTS:\n${evidencePool}\n\nSCRAPED TOP SOURCE:\n${scraped}`
  );
}

async function runAgreement(b64: string, profile: Profile, emit: Emit): Promise<HouseResult> {
  emit({ type: "agent_log", message: "Sarvam Parse · extracting clauses from agreement PDF…", tone: "reason" });
  const text = (await sarvam.parsePdf(b64)).slice(0, 12_000);
  return sarvam.chatJSON<HouseResult>(
    `You review Indian 11-month rent agreements for predatory clauses (lock-in with deposit forfeiture, arbitrary painting/cleaning charges, escalation >5%, notice-period traps, entry rights).
Score 0 (predatory) to 6 (clean) for tenant ${JSON.stringify(profile)}.
Return JSON: {"house":"agreement","score":<0-6>,"verdict_one_line":"<max 140 chars>","evidence":[{"quote":"<verbatim clause>","source_name":"rent agreement · Sarvam Parse","url":"#"}],"dealbreaker":<bool>}. Max 3 evidence items.`,
    text
  );
}

export async function runPipeline(req: AnalyzeRequest, emit: Emit): Promise<void> {
  // 1. INTAKE — parse the tenant's spoken/typed life-sentence.
  emit({ type: "status", message: "Reading listing…" });
  const profile = await sarvam.chatJSON<Profile>(
    `Extract a tenant profile from a possibly code-mixed (Hinglish/Kanglish) sentence.
Return JSON: {"office":"<work area or empty>","budget":<number or null>,"pets":<bool>,"family":"<short>","language":"<BCP-47 the user seems to prefer, default hi-IN>"}`,
    req.profileText || "(no profile given)"
  );

  // 2. LISTING — scrape and structure it.
  emit({ type: "agent_log", message: "Anakin · scraping listing page → markdown", tone: "scrape" });
  const listingMd = (await anakin.scrape(req.listingUrl)).slice(0, 4000);
  const listing = await sarvam.chatJSON<Listing>(
    `Extract listing facts from marketplace-page markdown.
Return JSON: {"society":"","locality":"","bhk":"","rent":<number>,"deposit":<number>,"sqft":<number>,"url":"${req.listingUrl}"}. Use 0/empty when unknown.`,
    listingMd
  );
  emit({ type: "listing_ready", listing });
  emit({
    type: "agent_log",
    message: `Sarvam-M · profile parsed: office ${profile.office || "?"} · budget ${profile.budget ? `₹${profile.budget}` : "?"} ${profile.pets ? "· pet" : ""}`,
    tone: "reason",
  });

  // 3. FAN-OUT — six dimension agents + optional agreement agent, in parallel.
  const dims = Object.keys(HOUSE_QUERIES) as Array<Exclude<HouseKey, "agreement">>;
  const tasks: Array<Promise<HouseResult>> = dims.map((h) => {
    emit({ type: "house_running", house: h });
    return withTimeout(runHouse(h, listing, profile, emit), HOUSE_TIMEOUT_MS);
  });
  if (req.agreementB64) {
    emit({ type: "house_running", house: "agreement" });
    tasks.push(withTimeout(runAgreement(req.agreementB64, profile, emit), HOUSE_TIMEOUT_MS * 1.5));
  }

  const keys: HouseKey[] = [...dims, ...(req.agreementB64 ? (["agreement"] as const) : [])];
  const settled = await Promise.allSettled(
    tasks.map(async (t, i) => {
      const r = await t;
      emit({ type: "house_complete", result: r });
      return r;
    })
  );
  const houses: HouseResult[] = [];
  settled.forEach((s, i) => {
    if (s.status === "fulfilled") houses.push(s.value);
    else {
      const k = keys[i];
      const q = k === "agreement" ? "" : HOUSE_QUERIES[k](listing, profile);
      emit({
        type: "house_failed",
        house: k,
        reason: "Couldn't verify in time — check manually",
        search_url: `https://www.google.com/search?q=${encodeURIComponent(q)}`,
      });
    }
  });

  // 4. SYNTHESIS — guna is computed, never model-reported; the model only writes prose.
  emit({ type: "agent_log", message: "Sarvam-M · matching houses against your profile…", tone: "reason" });
  const guna =
    houses.length > 0
      ? Math.round((houses.reduce((s, h) => s + h.score, 0) / (houses.length * 6)) * 36)
      : 0;
  const hasDealbreaker = houses.some((h) => h.dealbreaker);
  const label =
    hasDealbreaker || guna < 18
      ? "Avoid this match"
      : guna >= 27
        ? "Shubh match"
        : "Proceed with caution";

  const synth = await sarvam.chatJSON<{ verdict_en: string }>(
    `You are the final matchmaker for a flat-rental due-diligence report. The overall verdict is already decided: ${guna}/36 guna — "${label}". Produce:
{"verdict_en":"<max 70 words, speak directly to the tenant, consistent with that verdict; name the top strength, the top risk, and one action before signing>"}`,
    JSON.stringify({ profile, listing, houses })
  );
  const verdict_hi = await sarvam.translate(synth.verdict_en, profile.language || "hi-IN");
  const audio = await sarvam.tts(verdict_hi, profile.language || "hi-IN").catch(() => null);

  emit({
    type: "verdict",
    verdict: { guna, label, verdict_hi, verdict_en: synth.verdict_en, audio_b64: audio },
  });
}
