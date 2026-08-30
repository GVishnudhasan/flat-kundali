"use client";

import { motion } from "framer-motion";
import { HOUSES, scoreStatus, scoreWord } from "@/lib/houses";
import { Icon } from "./icons";
import type { HouseResult } from "@/lib/types";

const STATUS_TEXT: Record<string, string> = {
  good: "text-good",
  caution: "text-caution",
  risk: "text-risk",
};
const STATUS_DOT: Record<string, string> = {
  good: "bg-good",
  caution: "bg-caution",
  risk: "bg-risk",
};

export default function HouseCard({ result, index }: { result: HouseResult; index: number }) {
  const def = HOUSES.find((h) => h.key === result.house)!;
  const status = scoreStatus(result.score, result.dealbreaker);
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className={`glass rounded-2xl p-5 ${result.dealbreaker ? "!border-risk/40" : ""}`}
    >
      <header className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Icon name={def.icon as never} size={20} className="text-gold" />
          <div>
            <h4 className="text-[13px] font-semibold tracking-wide text-ink">{def.label}</h4>
            <p className="font-deva text-[12px] leading-none text-ink3">{def.hindi}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
          <span className="text-[15px] font-semibold text-ink">{result.score}/6</span>
          <span className={`text-[11px] font-medium uppercase tracking-wider ${STATUS_TEXT[status]}`}>
            {scoreWord(result.score, result.dealbreaker)}
          </span>
        </div>
      </header>
      <p className="mb-3 text-[13.5px] leading-relaxed text-ink2">{result.verdict_one_line}</p>
      <div className="space-y-2">
        {result.evidence.map((e, i) => (
          <a
            key={i}
            href={e.url}
            target="_blank"
            rel="noreferrer"
            className="block rounded-lg border border-white/5 bg-black/25 px-3 py-2 transition-colors hover:border-gold/30"
          >
            <p className="text-[12px] italic leading-snug text-ink2">&ldquo;{e.quote}&rdquo;</p>
            <p className="mt-1 text-[10.5px] font-medium uppercase tracking-widest text-gold/70">
              {e.source_name}
            </p>
          </a>
        ))}
      </div>
    </motion.article>
  );
}
