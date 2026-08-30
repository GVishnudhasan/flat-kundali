// Matchmaking pipeline: requirements (voice/typed) or a listing link →
// intent → robust search prompts → Anakin candidate discovery →
// per-flat compatibility scoring → ranked list (user's link boosted).

import * as sarvam from "./sarvam";
import * as anakin from "./anakin";
import type { Intent, MatchCandidate, MatchEvent, MatchRequest } from "./types";

type Emit = (e: MatchEvent) => void;

// Rental platforms we sweep in parallel. Anakin Wire structured actions are
// the upgrade path for sites it supports; the generic scraper is the
// universal fallback and works for all of these.
const PLATFORMS = [
  "nobroker.in",
  "magicbricks.com",
  "housing.com",
  "99acres.com",
  "rentmystay.com",
  "squareyards.com",
];

const LISTING_HOSTS = [
  ...PLATFORMS, "makaan", "nestaway", "commonfloor",
];

const MAX_CANDIDATES = 6;
const MAX_PER_PLATFORM = 2;
const SCORE_TIMEOUT_MS = 150_000;
const LINK_BOOST = 3; // the user's own link gets priority in ranking

const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
  Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);

const looksLikeListing = (url: string) =>
  LISTING_HOSTS.some((h) => url.includes(h));

async function extractIntent(req: MatchRequest, emit: Emit): Promise<Intent> {
  emit({ type: "match_log", message: "Sarvam · reading your requirements…", tone: "reason" });

  let anchor = "";
  if (req.mode === "link" && req.listingUrl) {
    emit({ type: "match_log", message: "Anakin · scraping your link → anchoring the search", tone: "scrape" });
    anchor = (await anakin.scrape(req.listingUrl, 20_000).catch(() => "")).slice(0, 3000);
  }

  const intent = await sarvam.chatJSON<Intent>(
    `Extract a Bengaluru flat-hunting intent from a possibly code-mixed (Hinglish/Kanglish) requirement sentence${anchor ? " and a reference listing the user likes" : ""}.
Return JSON: {"locality":"<target area(s), infer from office/reference if unstated>","bhk":"<e.g. 2 BHK>","budget":<monthly rent number or null>,"pets":<bool>,"office":"<work area or empty>","language":"<BCP-47, default hi-IN>","summary":"<one line, e.g. '2 BHK near Whitefield · budget ₹30k · dog-friendly'>"}`,
    `REQUIREMENTS: ${req.requirements || "(none given)"}\n${anchor ? `REFERENCE LISTING (markdown):\n${anchor}` : ""}`
  );
  emit({ type: "intent_ready", intent });
  return intent;
}

async function discoverCandidates(req: MatchRequest, intent: Intent, emit: Emit): Promise<MatchCandidate[]> {
  const budget = intent.budget ? ` under ₹${intent.budget}` : "";
  const base = `${intent.bhk} flat for rent in ${intent.locality} Bengaluru${budget}${intent.pets ? " pet friendly" : ""}`;

  // Multi-platform sweep: one targeted search per platform + one broad
  // search, all in parallel. Round-robin merge with a per-platform cap so
  // no single site dominates the rishta list.
  emit({
    type: "match_log",
    message: `Anakin · sweeping ${PLATFORMS.length} platforms in parallel: ${PLATFORMS.map((p) => p.split(".")[0]).join(", ")}…`,
    tone: "search",
  });
  const searches = [
    ...PLATFORMS.map((p) => ({ platform: p, prompt: `${base} on ${p} listing page` })),
    { platform: null as string | null, prompt: `${base} current listings near ${intent.office || intent.locality}` },
  ];
  const settled = await Promise.allSettled(searches.map((s) => anakin.search(s.prompt, 6)));

  const seen = new Set<string>();
  const isUsable = (url: string, title: string) =>
    url && !seen.has(url) && looksLikeListing(url) && !/for.?sale|\/sale\b/i.test(`${url} ${title}`);

  // bucket results by host
  const buckets = new Map<string, Array<{ url: string; title: string }>>();
  settled.forEach((s) => {
    if (s.status !== "fulfilled") return;
    for (const r of s.value) {
      if (!isUsable(r.url, r.title)) continue;
      seen.add(r.url);
      const host = new URL(r.url).hostname.replace("www.", "");
      const list = buckets.get(host) ?? [];
      if (list.length >= MAX_PER_PLATFORM) continue;
      list.push({ url: r.url, title: r.title.replace(/\s+/g, " ").trim() });
      buckets.set(host, list);
    }
  });

  const candidates: MatchCandidate[] = [];
  // The user's own link is always candidate #1 and featured.
  if (req.mode === "link" && req.listingUrl) {
    candidates.push({
      id: "own",
      society: "Your pick",
      locality: intent.locality,
      bhk: intent.bhk,
      rent: 0,
      url: req.listingUrl,
      source_name: new URL(req.listingUrl).hostname.replace("www.", ""),
      featured: true,
    });
  }

  // round-robin across platforms for source diversity
  const hosts = Array.from(buckets.keys());
  for (let round = 0; round < MAX_PER_PLATFORM; round++) {
    for (const host of hosts) {
      if (candidates.length >= MAX_CANDIDATES + (req.mode === "link" ? 1 : 0)) break;
      const item = buckets.get(host)?.[round];
      if (!item || item.url === req.listingUrl) continue;
      candidates.push({
        id: `c${candidates.length}`,
        society: item.title.slice(0, 60) || "Listing",
        locality: intent.locality,
        bhk: intent.bhk,
        rent: 0,
        url: item.url,
        source_name: host,
        featured: false,
      });
    }
  }

  const platformCount = new Set(candidates.map((c) => c.source_name)).size;
  emit({
    type: "match_log",
    message: `Anakin · ${candidates.length} live listings found across ${platformCount} platforms`,
    tone: "search",
  });
  candidates.forEach((c) => emit({ type: "candidate_found", candidate: c }));
  if (candidates.length === 0) throw new Error("No live listings found — try naming a locality");
  return candidates;
}

async function scoreCandidate(c: MatchCandidate, intent: Intent, emit: Emit): Promise<void> {
  const md = (await anakin.scrape(c.url, 15_000).catch(() => "")).slice(0, 2500);
  const scored = await sarvam.chatJSON<{
    society: string; locality: string; rent: number;
    guna: number; reasons: string[]; dealbreaker: string | null;
  }>(
    `You score one rental listing's compatibility with a tenant, like a kundali gun-milan.
Tenant intent: ${JSON.stringify(intent)}.
Return JSON: {"society":"<real project/society name from the page>","locality":"<area>","rent":<monthly number or 0>,"guna":<0-36 integer>,"reasons":["<3 short concrete reasons, max 60 chars each — include location fit vs office, budget fit, pet fit where relevant>"],"dealbreaker":"<one-line hard blocker or null>"}.
Guna calibration (like gun-milan): 30-36 exceptional match, 22-29 good, 14-21 mixed, below 14 poor. A listing matching BHK + budget + location should score 22+. If the page is a search/category page, score its best matching unit. Missing info lowers the score moderately, not to zero.`,
    `LISTING PAGE (markdown, may be partial):\n${md || "(scrape failed — use the URL only)"}\nURL: ${c.url}`
  );
  const guna = Math.max(0, Math.min(36, scored.guna + (c.featured ? LINK_BOOST : 0)));
  c.guna = guna;
  c.society = scored.society?.replace(/\s+/g, " ").trim() || c.society;
  c.locality = scored.locality || c.locality;
  c.rent = scored.rent || c.rent;
  // ship the extracted facts to the UI along with the score
  emit({
    type: "candidate_scored",
    id: c.id,
    guna,
    reasons: scored.reasons.slice(0, 3),
    dealbreaker: scored.dealbreaker,
    society: c.society,
    locality: c.locality,
    rent: c.rent,
  });
}

export async function runMatchmaker(req: MatchRequest, emit: Emit): Promise<void> {
  const intent = await extractIntent(req, emit);
  const candidates = await discoverCandidates(req, intent, emit);

  emit({ type: "match_log", message: `Anakin · scraping ${candidates.length} listing pages in parallel…`, tone: "scrape" });
  await Promise.allSettled(
    candidates.map(async (c) => {
      try {
        await withTimeout(scoreCandidate(c, intent, emit), SCORE_TIMEOUT_MS);
      } catch {
        emit({ type: "candidate_failed", id: c.id });
      }
    })
  );

  emit({ type: "match_log", message: `Sarvam · final gun-milan across ${candidates.length} rishtas…`, tone: "reason" });
  const order = candidates
    .filter((c) => c.guna != null)
    .sort((a, b) => (b.guna ?? 0) - (a.guna ?? 0))
    .map((c) => c.id);
  emit({ type: "ranked", order });
}
