"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import AgentFeed, { type FeedLine } from "@/components/AgentFeed";
import HouseCard from "@/components/HouseCard";
import InputPanel, { type AnalyzeInput } from "@/components/InputPanel";
import KundaliChart from "@/components/KundaliChart";
import VerdictPanel from "@/components/VerdictPanel";
import { HOUSES } from "@/lib/houses";
import type { AnalyzeEvent, HouseKey, HouseResult, HouseStatus, Listing, Verdict } from "@/lib/types";

type Phase = "input" | "running" | "verdict";

const initialStates = () =>
  Object.fromEntries(HOUSES.map((h) => [h.key, "pending"])) as Record<HouseKey, HouseStatus>;

export default function Page() {
  const [phase, setPhase] = useState<Phase>("input");
  const [houseStates, setHouseStates] = useState(initialStates);
  const [results, setResults] = useState<Partial<Record<HouseKey, HouseResult>>>({});
  const [listing, setListing] = useState<Listing | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [feed, setFeed] = useState<FeedLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const feedId = useRef(0);

  const pushFeed = useCallback((message: string, tone?: string) => {
    setFeed((f) => [...f, { id: feedId.current++, message, tone }]);
  }, []);

  const handleEvent = useCallback(
    (e: AnalyzeEvent) => {
      switch (e.type) {
        case "status":
          pushFeed(e.message, "reason");
          break;
        case "agent_log":
          pushFeed(e.message, e.tone);
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
          pushFeed(`△ ${e.house}: ${e.reason}`, "warn");
          break;
        case "verdict":
          setVerdict(e.verdict);
          setPhase("verdict");
          break;
        case "error":
          setError(e.message);
          pushFeed(`△ ${e.message}`, "warn");
          break;
      }
    },
    [pushFeed]
  );

  const analyze = async (input: AnalyzeInput) => {
    setPhase("running");
    setHouseStates(initialStates());
    setResults({});
    setListing(null);
    setVerdict(null);
    setFeed([]);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
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
          if (line.startsWith("data: ")) {
            handleEvent(JSON.parse(line.slice(6)) as AnalyzeEvent);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const orderedResults = HOUSES.map((h) => results[h.key]).filter(Boolean) as HouseResult[];

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 pb-24">
      {/* ---- header ---- */}
      <header className="flex items-center justify-between py-6">
        <button
          onClick={() => setPhase("input")}
          className="flex items-baseline gap-3 text-left"
          title="Start over"
        >
          <span className="font-deva text-[20px] text-gold">फ्लैट कुंडली</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink3">
            Flat Kundali
          </span>
        </button>
        <p className="text-[11px] uppercase tracking-[0.22em] text-ink3">
          Sarvam.ai × Anakin.io · AI Engineer Mixer, Bengaluru
        </p>
      </header>
      <div className="hairline" />

      <AnimatePresence mode="wait">
        {phase === "input" ? (
          /* ================= INPUT ================= */
          <motion.section
            key="input"
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center pt-16 text-center"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.8 }}
              className="mb-4 text-[12px] font-semibold uppercase tracking-[0.34em] text-gold/80"
            >
              Agentic due-diligence for Bengaluru rentals
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-[56px] leading-[1.05] text-ink md:text-[72px]"
            >
              Match your kundali
              <br />
              <span className="text-gold">with a flat&rsquo;s.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="mt-5 max-w-lg text-[15px] leading-relaxed text-ink2"
            >
              Seven agents read the live web — water, commute, society, price, red flags,
              livability, and the fine print of your agreement — then deliver a spoken verdict
              in your language, before you sign the lease.
            </motion.p>
            <div className="mt-10 w-full max-w-xl">
              <InputPanel onSubmit={analyze} disabled={false} />
            </div>
          </motion.section>
        ) : (
          /* ================= RUNNING / VERDICT ================= */
          <motion.section
            key="run"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid gap-10 pt-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]"
          >
            {/* left: the chart */}
            <div className="lg:sticky lg:top-8 lg:self-start">
              <KundaliChart
                houseStates={houseStates}
                results={results}
                listing={listing}
                verdict={verdict}
              />
            </div>

            {/* right: listing, feed / verdict */}
            <div className="space-y-5">
              {listing && (
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-2xl p-5"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink3">
                    Reading the kundali of
                  </p>
                  <h2 className="mt-1 font-display text-[24px] text-ink">{listing.society}</h2>
                  <p className="mt-0.5 text-[13px] text-ink2">
                    {listing.locality} · {listing.bhk} · {listing.sqft} sqft
                  </p>
                  <div className="mt-3 flex gap-6">
                    <div>
                      <p className="text-[10.5px] uppercase tracking-widest text-ink3">Rent</p>
                      <p className="text-[17px] font-semibold text-ink">
                        ₹{listing.rent.toLocaleString("en-IN")}
                        <span className="text-[12px] font-normal text-ink3">/mo</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10.5px] uppercase tracking-widest text-ink3">Deposit</p>
                      <p className="text-[17px] font-semibold text-ink">
                        ₹{listing.deposit.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {verdict ? <VerdictPanel verdict={verdict} /> : <AgentFeed lines={feed} live={phase === "running"} />}

              {error && (
                <div className="glass rounded-2xl border !border-risk/35 p-4 text-[13px] text-risk">
                  △ {error} — the agents kept whatever evidence they had.
                </div>
              )}

              {verdict && (
                <button
                  onClick={() => setPhase("input")}
                  className="w-full rounded-xl border border-gold/25 bg-black/25 px-5 py-3 text-[13px] text-ink2 transition-colors hover:border-gold/50 hover:text-ink"
                >
                  ↺ Read another flat&rsquo;s kundali
                </button>
              )}
            </div>

            {/* evidence grid, full width */}
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
        <span>Voice & reasoning · Sarvam.ai</span>
        <span className="text-gold/50">✦</span>
        <span>Live web evidence · Anakin.io</span>
      </footer>
    </main>
  );
}
