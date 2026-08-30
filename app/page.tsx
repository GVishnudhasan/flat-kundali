"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import AgentFeed, { type FeedLine } from "@/components/AgentFeed";
import AgreementXray from "@/components/AgreementXray";
import HouseCard from "@/components/HouseCard";
import KundaliChart from "@/components/KundaliChart";
import Landing from "@/components/Landing";
import MatchCard from "@/components/MatchCard";
import VerdictPanel from "@/components/VerdictPanel";
import { HOUSES } from "@/lib/houses";
import type {
  AnalyzeEvent, HouseKey, HouseResult, HouseStatus, Intent, Listing,
  MatchCandidate, MatchEvent, MatchRequest, Verdict,
} from "@/lib/types";

type View = "landing" | "matches" | "deep" | "agreement";

const initialStates = () =>
  Object.fromEntries(HOUSES.map((h) => [h.key, "pending"])) as Record<HouseKey, HouseStatus>;

async function consumeSSE(res: Response, onEvent: (e: any) => void) {
  if (!res.body) throw new Error("No stream");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.trim();
      if (line.startsWith("data: ")) onEvent(JSON.parse(line.slice(6)));
    }
  }
}

export default function Page() {
  const [view, setView] = useState<View>("landing");

  // ---- matchmaking state ----
  const [intent, setIntent] = useState<Intent | null>(null);
  const [candidates, setCandidates] = useState<MatchCandidate[]>([]);
  const [order, setOrder] = useState<string[] | null>(null);
  const [matchFeed, setMatchFeed] = useState<FeedLine[]>([]);
  const [matchLive, setMatchLive] = useState(false);
  const [requirements, setRequirements] = useState("");

  // ---- deep-dive state ----
  const [houseStates, setHouseStates] = useState(initialStates);
  const [results, setResults] = useState<Partial<Record<HouseKey, HouseResult>>>({});
  const [listing, setListing] = useState<Listing | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [deepFeed, setDeepFeed] = useState<FeedLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const feedId = useRef(0);

  const pushMatchFeed = useCallback((message: string, tone?: string) => {
    setMatchFeed((f) => [...f, { id: feedId.current++, message, tone }]);
  }, []);
  const pushDeepFeed = useCallback((message: string, tone?: string) => {
    setDeepFeed((f) => [...f, { id: feedId.current++, message, tone }]);
  }, []);

  // ================= MATCHMAKING =================
  const startMatch = async (req: MatchRequest) => {
    setView("matches");
    setIntent(null);
    setCandidates([]);
    setOrder(null);
    setMatchFeed([]);
    setError(null);
    setMatchLive(true);
    setRequirements(req.requirements);

    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      await consumeSSE(res, (e: MatchEvent) => {
        switch (e.type) {
          case "match_log":
            pushMatchFeed(e.message, e.tone);
            break;
          case "intent_ready":
            setIntent(e.intent);
            break;
          case "candidate_found":
            setCandidates((c) => [...c, e.candidate]);
            break;
          case "candidate_scored":
            setCandidates((cs) =>
              cs.map((c) =>
                c.id === e.id
                  ? {
                      ...c,
                      guna: e.guna,
                      reasons: e.reasons,
                      dealbreaker: e.dealbreaker,
                      society: e.society || c.society,
                      locality: e.locality || c.locality,
                      rent: e.rent || c.rent,
                    }
                  : c
              )
            );
            break;
          case "candidate_failed":
            setCandidates((cs) => cs.filter((c) => c.id !== e.id));
            pushMatchFeed("△ one candidate couldn't be verified — dropped", "warn");
            break;
          case "ranked":
            setOrder(e.order);
            break;
          case "error":
            setError(e.message);
            break;
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Matchmaking failed");
    } finally {
      setMatchLive(false);
    }
  };

  // ================= DEEP DIVE =================
  const startDeepDive = async (c: MatchCandidate) => {
    setView("deep");
    setHouseStates(initialStates());
    setResults({});
    setListing(null);
    setVerdict(null);
    setDeepFeed([]);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingUrl: c.url, profileText: requirements }),
      });
      await consumeSSE(res, (e: AnalyzeEvent) => {
        switch (e.type) {
          case "status":
            pushDeepFeed(e.message, "reason");
            break;
          case "agent_log":
            pushDeepFeed(e.message, e.tone);
            break;
          case "listing_ready":
            setListing(e.listing);
            break;
          case "house_running":
            setHouseStates((s) => ({ ...s, [e.house]: "running" }));
            break;
          case "house_complete":
            setHouseStates((s) => ({ ...s, [e.result.house]: "complete" }));
            setResults((r) => ({ ...r, [e.result.house]: e.result }));
            break;
          case "house_failed":
            setHouseStates((s) => ({ ...s, [e.house]: "failed" }));
            pushDeepFeed(`△ ${e.house}: ${e.reason}`, "warn");
            break;
          case "verdict":
            setVerdict(e.verdict);
            break;
          case "error":
            setError(e.message);
            break;
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    }
  };

  // ranked display order: pre-ranking = arrival order, post-ranking = guna order
  const displayed = order
    ? (order.map((id) => candidates.find((c) => c.id === id)).filter(Boolean) as MatchCandidate[])
    : candidates;

  const orderedResults = HOUSES.map((h) => results[h.key]).filter(Boolean) as HouseResult[];
  const profileLine = intent?.summary ?? (requirements ? requirements : "आप");

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 pb-24">
      {/* ---- header ---- */}
      <header className="flex items-center justify-between py-6">
        <button onClick={() => setView("landing")} className="flex items-baseline gap-3 text-left" title="Start over">
          <span className="font-deva text-[20px] text-gold">फ्लैट कुंडली</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink3">Flat Kundali</span>
        </button>
        <p className="text-[11px] uppercase tracking-[0.22em] text-ink3">
          Sarvam.ai × Anakin.io · AI Engineer Mixer, Bengaluru
        </p>
      </header>
      <div className="hairline" />

      <AnimatePresence mode="wait">
        {view === "landing" && (
          <motion.div key="landing" exit={{ opacity: 0, y: -18 }} transition={{ duration: 0.35 }}>
            <Landing onMatch={startMatch} onAgreement={() => setView("agreement")} />
          </motion.div>
        )}

        {view === "agreement" && (
          <motion.div key="agreement" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <AgreementXray onBack={() => setView("landing")} />
          </motion.div>
        )}

        {/* ================= MATCH RESULTS ================= */}
        {view === "matches" && (
          <motion.section
            key="matches"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-3xl pt-8"
          >
            <button onClick={() => setView("landing")} className="mb-5 text-[12.5px] text-ink3 hover:text-gold">
              ← New search
            </button>

            <div className="mb-1 flex items-end justify-between gap-4">
              <h1 className="font-display text-[34px] text-ink">
                {order ? "Your rishtas, ranked" : "Finding your rishtas…"}
              </h1>
              {matchLive && (
                <span className="mb-2 flex items-center gap-1.5 text-[11.5px] text-gold">
                  <motion.span
                    className="inline-block h-1.5 w-1.5 rounded-full bg-gold"
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                  agents working
                </span>
              )}
            </div>
            {intent && (
              <p className="mb-6 text-[13.5px] text-ink2">
                Matching against: <span className="text-gold">{intent.summary}</span>
              </p>
            )}

            <div className="space-y-4">
              {displayed.map((c, i) => (
                <MatchCard key={c.id} candidate={c} rank={order ? i + 1 : null} onDeepDive={startDeepDive} />
              ))}
              {candidates.length === 0 && !error && (
                <div className="glass rounded-2xl p-10 text-center text-[13.5px] text-ink3">
                  <motion.span
                    className="mx-auto mb-4 block h-8 w-8 rounded-full border-2 border-gold/25 border-t-gold"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Reading your requirements &amp; searching the live web…
                </div>
              )}
            </div>

            {error && (
              <div className="glass mt-4 rounded-2xl border !border-risk/35 p-4 text-[13px] text-risk">△ {error}</div>
            )}

            <div className="mt-8">
              <AgentFeed lines={matchFeed} live={matchLive} />
            </div>
          </motion.section>
        )}

        {/* ================= DEEP DIVE ================= */}
        {view === "deep" && (
          <motion.section
            key="deep"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="grid gap-10 pt-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]"
          >
            <div className="lg:sticky lg:top-8 lg:self-start">
              <button onClick={() => setView("matches")} className="mb-4 text-[12.5px] text-ink3 hover:text-gold">
                ← Back to matches
              </button>
              <KundaliChart
                houseStates={houseStates}
                results={results}
                listing={listing}
                verdict={verdict}
                profileLine={profileLine}
              />
            </div>

            <div className="space-y-5 lg:pt-9">
              {listing && (
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink3">Reading the kundali of</p>
                  <h2 className="mt-1 font-display text-[24px] text-ink">{listing.society}</h2>
                  <p className="mt-0.5 text-[13px] text-ink2">
                    {listing.locality} · {listing.bhk}{listing.sqft ? ` · ${listing.sqft} sqft` : ""}
                  </p>
                  <div className="mt-3 flex gap-6">
                    <div>
                      <p className="text-[10.5px] uppercase tracking-widest text-ink3">Rent</p>
                      <p className="text-[17px] font-semibold text-ink">
                        ₹{listing.rent.toLocaleString("en-IN")}
                        <span className="text-[12px] font-normal text-ink3">/mo</span>
                      </p>
                    </div>
                    {listing.deposit > 0 && (
                      <div>
                        <p className="text-[10.5px] uppercase tracking-widest text-ink3">Deposit</p>
                        <p className="text-[17px] font-semibold text-ink">₹{listing.deposit.toLocaleString("en-IN")}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {verdict ? <VerdictPanel verdict={verdict} /> : <AgentFeed lines={deepFeed} live={!verdict && !error} />}

              {error && (
                <div className="glass rounded-2xl border !border-risk/35 p-4 text-[13px] text-risk">
                  △ {error} — the agents kept whatever evidence they had.
                </div>
              )}
            </div>

            {orderedResults.length > 0 && (
              <div className="lg:col-span-2">
                <div className="mb-4 mt-2 flex items-center gap-4">
                  <h3 className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.26em] text-ink3">
                    Evidence · house by house
                  </h3>
                  <div className="hairline w-full" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {orderedResults.map((r, i) => (
                    <HouseCard key={r.house} result={r} index={i} />
                  ))}
                </div>
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      <footer className="mt-24 flex items-center justify-center gap-2 text-[11px] text-ink3">
        <span>Voice &amp; reasoning · Sarvam.ai</span>
        <span className="text-gold/50">✦</span>
        <span>Live web evidence · Anakin.io</span>
      </footer>
    </main>
  );
}
