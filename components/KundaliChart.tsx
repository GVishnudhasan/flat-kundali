"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { HOUSES, SELF_DIAMOND, YOU_DIAMOND, scoreStatus } from "@/lib/houses";
import { ICON_PATHS } from "./icons";
import type { HouseKey, HouseResult, HouseStatus, Listing, Verdict } from "@/lib/types";

const STATUS_FILL: Record<string, string> = {
  good: "#2FA36B",
  caution: "#BE8B1D",
  risk: "#D8596B",
};

interface Props {
  houseStates: Record<HouseKey, HouseStatus>;
  results: Partial<Record<HouseKey, HouseResult>>;
  listing: Listing | null;
  verdict: Verdict | null;
  profileLine: string; // shown in the bottom "You" diamond
}

function useCountUp(target: number | null, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target == null) return;
    let raf: number;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

export default function KundaliChart({ houseStates, results, listing, verdict, profileLine }: Props) {
  const [hover, setHover] = useState<{ key: HouseKey; x: number; y: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const guna = useCountUp(verdict ? verdict.guna : null);

  const onMove = (key: HouseKey) => (e: React.MouseEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHover({ key, x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const hoverResult = hover ? results[hover.key] : undefined;

  return (
    <div ref={wrapRef} className="relative select-none">
      <motion.svg
        viewBox="0 0 640 640"
        className="w-full drop-shadow-[0_0_60px_rgba(231,195,104,0.08)]"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <defs>
          <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="goldStroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f2d68f" />
            <stop offset="55%" stopColor="#d3a94e" />
            <stop offset="100%" stopColor="#9c7c33" />
          </linearGradient>
          <radialGradient id="medallion" cx="50%" cy="38%" r="70%">
            <stop offset="0%" stopColor="#1a2340" />
            <stop offset="100%" stopColor="#0b101f" />
          </radialGradient>
        </defs>

        {/* ceremonial rotating ring behind the chart */}
        <g className="spin-slow" opacity={0.08}>
          <circle cx="320" cy="320" r="300" fill="none" stroke="#e7c368" strokeWidth="1" strokeDasharray="3 9" />
          <circle cx="320" cy="320" r="230" fill="none" stroke="#e7c368" strokeWidth="0.8" strokeDasharray="1 14" />
        </g>

        {/* ---- house region fills (state-driven) ---- */}
        {HOUSES.map((h) => {
          const state = houseStates[h.key];
          const r = results[h.key];
          const status = r ? scoreStatus(r.score, r.dealbreaker) : null;
          const fill = status ? STATUS_FILL[status] : "#e7c368";
          return (
            <motion.polygon
              key={h.key}
              points={h.points}
              fill={fill}
              stroke="none"
              style={{ cursor: state === "complete" ? "pointer" : "default" }}
              onMouseMove={onMove(h.key)}
              onMouseLeave={() => setHover(null)}
              initial={{ opacity: 0 }}
              animate={
                state === "running"
                  ? { opacity: [0.03, 0.13, 0.03] }
                  : state === "complete"
                    ? { opacity: r?.dealbreaker ? [0.34, 0.16] : [0.4, 0.15] }
                    : state === "failed"
                      ? { opacity: 0.05 }
                      : { opacity: 0 }
              }
              transition={
                state === "running"
                  ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 1.1, ease: "easeOut" }
              }
            />
          );
        })}

        {/* self diamond (lagna) + you diamond subtle fills */}
        <polygon points={SELF_DIAMOND} fill="#e7c368" opacity={listing ? 0.05 : 0} />
        <polygon points={YOU_DIAMOND} fill="#e7c368" opacity={0.04} />

        {/* ---- gold linework ---- */}
        <g stroke="url(#goldStroke)" fill="none" filter="url(#goldGlow)">
          <motion.rect
            x="20" y="20" width="600" height="600" strokeWidth="2.2"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease: "easeInOut" }}
          />
          <rect x="30" y="30" width="580" height="580" strokeWidth="0.6" opacity="0.5" />
          <motion.polygon
            points="320,20 620,320 320,620 20,320" strokeWidth="1.6"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, delay: 0.35, ease: "easeInOut" }}
          />
          <motion.line x1="20" y1="20" x2="620" y2="620" strokeWidth="1.1" opacity="0.85"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, delay: 0.7 }} />
          <motion.line x1="620" y1="20" x2="20" y2="620" strokeWidth="1.1" opacity="0.85"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, delay: 0.7 }} />
        </g>

        {/* ---- self diamond content: the listing ---- */}
        <g textAnchor="middle" pointerEvents="none">
          {listing ? (
            <>
              <text x="320" y="128" fill="#e7c368" fontSize="13" letterSpacing="1.5" opacity="0.8" fontFamily="var(--font-deva)">
                लग्न · THE FLAT
              </text>
              <text x="320" y="156" fill="#f2efe6" fontSize="19" fontFamily="var(--font-display)">
                {listing.society}
              </text>
              <text x="320" y="180" fill="#a9afc3" fontSize="12.5" fontFamily="var(--font-body)">
                {listing.bhk} · ₹{listing.rent.toLocaleString("en-IN")}/mo · {listing.locality.split(",")[0]}
              </text>
            </>
          ) : (
            <text x="320" y="160" fill="#697089" fontSize="13" letterSpacing="1.5" fontFamily="var(--font-deva)">
              लग्न · AWAITING THE FLAT
            </text>
          )}
        </g>

        {/* ---- you diamond content: the tenant ---- */}
        <g textAnchor="middle" pointerEvents="none">
          <text x="320" y="468" fill="#e7c368" fontSize="13" letterSpacing="1.5" opacity="0.8" fontFamily="var(--font-deva)">
            वर · YOU
          </text>
          <text x="320" y="492" fill="#a9afc3" fontSize="12.5" fontFamily="var(--font-body)">
            {profileLine.length > 46 ? `${profileLine.slice(0, 46)}…` : profileLine}
          </text>
        </g>

        {/* ---- house content ---- */}
        {HOUSES.map((h) => {
          const state = houseStates[h.key];
          const r = results[h.key];
          const status = r ? scoreStatus(r.score, r.dealbreaker) : null;
          const dim = state === "pending";
          const [ax, ay] = h.anchor;
          return (
            <g key={h.key} textAnchor="middle" pointerEvents="none" opacity={dim ? 0.38 : 1}>
              <g
                transform={`translate(${ax - 12}, ${ay - 34})`}
                stroke="#e7c368"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              >
                {ICON_PATHS[h.icon].map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </g>
              <text x={ax} y={ay + 10} fill="#cfd3e2" fontSize="11.5" letterSpacing="2.2" fontFamily="var(--font-body)">
                {h.label.toUpperCase()}
              </text>
              <text x={ax} y={ay + 27} fill="#8a83a0" fontSize="12" fontFamily="var(--font-deva)">
                {h.hindi}
              </text>
              {state === "running" && (
                <motion.text x={ax} y={ay + 47} fill="#e7c368" fontSize="11" fontFamily="var(--font-body)"
                  animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }}>
                  consulting…
                </motion.text>
              )}
              {state === "complete" && r && (
                <motion.g initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}>
                  <circle cx={ax} cy={ay + 45} r="3.5" fill={STATUS_FILL[status!]} />
                  <text x={ax + 8} y={ay + 49} textAnchor="start" fill="#f2efe6" fontSize="13" fontWeight="600" fontFamily="var(--font-body)">
                    {r.score}/6
                  </text>
                </motion.g>
              )}
              {state === "failed" && (
                <text x={ax} y={ay + 47} fill="#697089" fontSize="11" fontFamily="var(--font-body)">
                  unverified
                </text>
              )}
            </g>
          );
        })}

        {/* ---- center medallion: the guna reveal ---- */}
        {verdict && (
          <motion.g initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 160, damping: 16 }}>
            <circle cx="320" cy="320" r="96" fill="url(#medallion)" stroke="url(#goldStroke)" strokeWidth="2" filter="url(#goldGlow)" />
            <circle cx="320" cy="320" r="86" fill="none" stroke="#e7c368" strokeWidth="0.6" opacity="0.4" strokeDasharray="2 6" />
            {/* progress arc: guna / 36 */}
            <motion.circle
              cx="320" cy="320" r="76" fill="none"
              stroke={STATUS_FILL[verdict.guna >= 27 ? "good" : verdict.guna >= 18 ? "caution" : "risk"]}
              strokeWidth="4" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 76}
              initial={{ strokeDashoffset: 2 * Math.PI * 76 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 76 * (1 - verdict.guna / 36) }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              transform="rotate(-90 320 320)"
            />
            <text x="320" y="316" textAnchor="middle" fill="#f2efe6" fontSize="52" fontFamily="var(--font-display)">
              {guna}
            </text>
            <text x="320" y="342" textAnchor="middle" fill="#a9afc3" fontSize="14" fontFamily="var(--font-deva)">
              / 36 गुण
            </text>
          </motion.g>
        )}
      </motion.svg>

      {/* hover tooltip */}
      {hover && hoverResult && (
        <div
          className="glass pointer-events-none absolute z-10 max-w-[260px] rounded-xl px-3.5 py-2.5 text-[12.5px] leading-snug text-ink2"
          style={{ left: Math.min(hover.x + 14, 400), top: hover.y + 10 }}
        >
          <span className="font-semibold text-ink">{hoverResult.score}/6 · </span>
          {hoverResult.verdict_one_line}
        </div>
      )}
    </div>
  );
}
