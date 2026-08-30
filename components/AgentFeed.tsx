"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

export interface FeedLine {
  id: number;
  message: string;
  tone?: string;
}

const TONE_ICON: Record<string, string> = {
  search: "🔍",
  scrape: "📄",
  translate: "🈯",
  reason: "✦",
  warn: "△",
};

export default function AgentFeed({ lines, live }: { lines: FeedLine[]; live: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [lines.length]);

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold tracking-[0.22em] text-ink3">AGENT CONSOLE</h3>
        {live && (
          <span className="flex items-center gap-1.5 text-[11px] text-gold">
            <motion.span
              className="inline-block h-1.5 w-1.5 rounded-full bg-gold"
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            working
          </span>
        )}
      </div>
      <div ref={ref} className="feed max-h-64 space-y-2 overflow-y-auto pr-1">
        {lines.map((l) => (
          <motion.div
            key={l.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
            className="flex items-start gap-2.5 text-[12.5px] leading-snug text-ink2"
          >
            <span className="mt-px w-4 shrink-0 text-center text-gold/80">
              {TONE_ICON[l.tone ?? "reason"] ?? "✦"}
            </span>
            <span>{l.message}</span>
          </motion.div>
        ))}
        {lines.length === 0 && (
          <p className="text-[12.5px] italic text-ink3">Agents are waking up…</p>
        )}
      </div>
    </div>
  );
}
