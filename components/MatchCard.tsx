"use client";

import { motion } from "framer-motion";
import { gunaStatus } from "@/lib/houses";
import { Icon } from "./icons";
import type { MatchCandidate } from "@/lib/types";

const STATUS_STROKE: Record<string, string> = {
  good: "#2FA36B",
  caution: "#BE8B1D",
  risk: "#D8596B",
};

function MiniGuna({ guna }: { guna: number }) {
  const r = 24;
  const c = 2 * Math.PI * r;
  const color = STATUS_STROKE[gunaStatus(guna)];
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(231,195,104,0.12)" strokeWidth="4" />
        <motion.circle
          cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - guna / 36) }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[16px] font-semibold leading-none text-ink">{guna}</span>
        <span className="text-[8.5px] text-ink3">/36</span>
      </div>
    </div>
  );
}

export default function MatchCard({
  candidate: c,
  rank,
  onDeepDive,
}: {
  candidate: MatchCandidate;
  rank: number | null; // null until ranking is final
  onDeepDive: (c: MatchCandidate) => void;
}) {
  const scored = c.guna != null;
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ layout: { type: "spring", stiffness: 220, damping: 26 }, duration: 0.5 }}
      className={`glass relative rounded-2xl p-5 ${c.featured ? "!border-gold/45" : ""} ${
        rank === 1 ? "shadow-glow" : ""
      }`}
    >
      {c.featured && (
        <span className="absolute -top-2.5 left-5 rounded-full border border-gold/50 bg-[#171204] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gold">
          ✦ your pick — prioritised
        </span>
      )}
      <div className="flex items-center gap-4">
        {/* rank medal */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border font-display text-[17px] ${
            rank === 1
              ? "border-gold/70 bg-gold/15 text-gold"
              : "border-white/10 bg-black/25 text-ink2"
          }`}
        >
          {rank ?? "·"}
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="truncate font-display text-[18px] leading-tight text-ink">{c.society}</h4>
          <p className="mt-0.5 text-[12.5px] text-ink3">
            {c.locality} · {c.bhk}
            {c.rent ? ` · ₹${c.rent.toLocaleString("en-IN")}/mo` : ""} ·{" "}
            <a href={c.url} target="_blank" rel="noreferrer" className="text-gold/70 underline decoration-gold/25 underline-offset-2 hover:text-gold">
              {c.source_name}
            </a>
          </p>
        </div>

        {scored ? (
          <MiniGuna guna={c.guna!} />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center">
            <motion.span
              className="inline-block h-6 w-6 rounded-full border-2 border-gold/25 border-t-gold"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        )}
      </div>

      {scored && (
        <>
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {(c.reasons ?? []).map((r, i) => (
              <span key={i} className="rounded-full border border-white/8 bg-black/25 px-2.5 py-1 text-[11.5px] text-ink2">
                {r}
              </span>
            ))}
          </div>
          {c.dealbreaker && (
            <p className="mt-2.5 flex items-start gap-2 rounded-lg border border-risk/30 bg-risk/10 px-3 py-2 text-[12px] text-risk">
              <Icon name="alert" size={14} className="mt-0.5" /> <span>Dealbreaker · {c.dealbreaker}</span>
            </p>
          )}
          <button
            onClick={() => onDeepDive(c)}
            className="mt-4 w-full rounded-xl border border-gold/25 bg-black/25 px-4 py-2.5 text-[12.5px] font-medium text-gold transition-colors hover:border-gold/55 hover:bg-gold/5"
          >
            Full kundali reading →
          </button>
        </>
      )}
    </motion.article>
  );
}
