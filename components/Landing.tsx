"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import MicButton from "./MicButton";
import type { MatchRequest } from "@/lib/types";

const EXAMPLE_URL = "https://www.nobroker.in/sobha-dream-acres-2bhk";
const EXAMPLE_REQ = "Main Whitefield mein kaam karta hoon, do din WFH, ek dog hai, budget 30k tak.";

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 26 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] as const },
});

export default function Landing({
  onMatch,
  onAgreement,
}: {
  onMatch: (req: MatchRequest) => void;
  onAgreement: () => void;
}) {
  const [url, setUrl] = useState("");
  const [req, setReq] = useState("");

  return (
    <section className="flex flex-col items-center pt-14 text-center">
      <motion.p {...rise(0.05)} className="mb-4 text-[12px] font-semibold uppercase tracking-[0.34em] text-gold/80">
        Agentic flat matchmaking for Bengaluru
      </motion.p>
      <motion.h1 {...rise(0.12)} className="font-display text-[52px] leading-[1.05] text-ink md:text-[68px]">
        Match your kundali
        <br />
        <span className="text-gold">with a flat&rsquo;s.</span>
      </motion.h1>
      <motion.p {...rise(0.22)} className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink2">
        Speak your requirements — or drop a listing you like. Agents search the live web,
        read every candidate against your life, and return a ranked list of rishtas,
        each with its guna score. In your language, with sources.
      </motion.p>

      {/* ---- two entry modes ---- */}
      <div className="mt-12 grid w-full max-w-4xl gap-5 md:grid-cols-2">
        {/* voice / requirements */}
        <motion.div {...rise(0.3)} className="glass group flex flex-col rounded-3xl p-7 text-left transition-shadow hover:shadow-glow">
          <div className="mb-1 flex items-center gap-3">
            <span className="text-2xl">🎙️</span>
            <h2 className="font-display text-[21px] text-ink">Find flats for me</h2>
          </div>
          <p className="mb-5 text-[12.5px] leading-relaxed text-ink3">
            Tell us your life in one line — Hinglish works. We&rsquo;ll find and rank live listings near you.
          </p>
          <div className="flex items-start gap-2.5">
            <textarea
              value={req}
              onChange={(e) => setReq(e.target.value)}
              placeholder='"Whitefield mein kaam, ek dog, budget 30k…"'
              rows={2}
              className="field w-full resize-none rounded-xl px-4 py-3 text-[14px] text-ink placeholder:text-ink3"
            />
            <MicButton onTranscript={(t) => setReq((p) => (p ? `${p} ${t}` : t))} />
          </div>
          <button
            disabled={req.trim().length < 8}
            onClick={() => onMatch({ mode: "voice", requirements: req.trim() })}
            className="btn-gold mt-4 w-full rounded-xl px-6 py-3.5 text-[14px] font-bold tracking-wide"
          >
            ✦ Find my rishtas
          </button>
          <button
            type="button"
            onClick={() => setReq(EXAMPLE_REQ)}
            className="mx-auto mt-3 text-[12px] text-ink3 underline decoration-gold/30 underline-offset-4 hover:text-gold"
          >
            Try the example — Whitefield · dog · ₹30k
          </button>
        </motion.div>

        {/* link mode */}
        <motion.div {...rise(0.38)} className="glass group flex flex-col rounded-3xl p-7 text-left transition-shadow hover:shadow-glow">
          <div className="mb-1 flex items-center gap-3">
            <span className="text-2xl">🔗</span>
            <h2 className="font-display text-[21px] text-ink">I found a flat — check it</h2>
          </div>
          <p className="mb-5 text-[12.5px] leading-relaxed text-ink3">
            Paste the listing. We&rsquo;ll vet it, find similar flats nearby, and rank them all — yours gets priority.
          </p>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a NoBroker / 99acres / MagicBricks link…"
            spellCheck={false}
            className="field w-full rounded-xl px-4 py-3 text-[14px] text-ink placeholder:text-ink3"
          />
          <div className="mt-3 flex items-start gap-2.5">
            <textarea
              value={req}
              onChange={(e) => setReq(e.target.value)}
              placeholder="Optional: your life in one line…"
              rows={1}
              className="field w-full resize-none rounded-xl px-4 py-3 text-[13px] text-ink placeholder:text-ink3"
            />
            <MicButton onTranscript={(t) => setReq((p) => (p ? `${p} ${t}` : t))} />
          </div>
          <button
            disabled={url.trim().length < 10}
            onClick={() => onMatch({ mode: "link", listingUrl: url.trim(), requirements: req.trim() })}
            className="btn-gold mt-4 w-full rounded-xl px-6 py-3.5 text-[14px] font-bold tracking-wide"
          >
            ✦ Vet it &amp; rank alternatives
          </button>
          <button
            type="button"
            onClick={() => {
              setUrl(EXAMPLE_URL);
              setReq(EXAMPLE_REQ);
            }}
            className="mx-auto mt-3 text-[12px] text-ink3 underline decoration-gold/30 underline-offset-4 hover:text-gold"
          >
            Try the example — Sobha Dream Acres · 2 BHK · ₹28k
          </button>
        </motion.div>
      </div>

      {/* ---- separate tool: Agreement X-Ray ---- */}
      <motion.button
        {...rise(0.48)}
        onClick={onAgreement}
        className="glass mt-6 flex w-full max-w-4xl items-center justify-between rounded-2xl px-6 py-4 text-left transition-colors hover:!border-gold/40"
      >
        <div className="flex items-center gap-4">
          <span className="text-xl">📜</span>
          <div>
            <p className="text-[14px] font-semibold text-ink">
              Agreement X-Ray
              <span className="ml-2.5 rounded-full border border-gold/30 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold/90">
                separate tool
              </span>
            </p>
            <p className="text-[12px] text-ink3">
              Already have a rent agreement? Scan its fine print for predatory clauses — spoken verdict in Hindi.
            </p>
          </div>
        </div>
        <span className="text-gold">→</span>
      </motion.button>
    </section>
  );
}
