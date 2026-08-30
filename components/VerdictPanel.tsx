"use client";

import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { Icon } from "./icons";
import type { Verdict } from "@/lib/types";

const LABEL_STYLE: Record<string, string> = {
  "Shubh match": "text-good border-good/40",
  "Proceed with caution": "text-caution border-caution/40",
  "Avoid this match": "text-risk border-risk/40",
};

export default function VerdictPanel({ verdict }: { verdict: Verdict }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = () => {
    if (playing) {
      audioRef.current?.pause();
      window.speechSynthesis?.cancel();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    if (verdict.audio_b64) {
      const audio = new Audio(`data:audio/wav;base64,${verdict.audio_b64}`);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.play();
    } else {
      // Mock-mode fallback: browser TTS so the demo always has a voice.
      const u = new SpeechSynthesisUtterance(verdict.verdict_hi);
      u.lang = "hi-IN";
      u.rate = 0.95;
      u.onend = () => setPlaying(false);
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="glass rounded-2xl p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-display text-[22px] text-ink">The Verdict</h3>
        <span
          className={`rounded-full border px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${LABEL_STYLE[verdict.label] ?? "text-caution border-caution/40"}`}
        >
          {verdict.label}
        </span>
      </div>

      <p className="font-deva text-[17px] leading-[1.9] text-ink">{verdict.verdict_hi}</p>
      <div className="hairline my-4" />
      <p className="text-[13px] leading-relaxed text-ink2">{verdict.verdict_en}</p>

      <button
        onClick={play}
        className="btn-gold mt-5 flex w-full items-center justify-center gap-3 rounded-xl px-5 py-3.5 text-[14px] font-semibold"
      >
        {playing ? (
          <>
            <span className="flex h-4 items-end gap-[3px]">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="eq-bar w-[3px] rounded-full bg-[#171204]"
                  style={{ height: 16, animationDelay: `${i * 0.12}s` }}
                />
              ))}
            </span>
            Playing verdict…
          </>
        ) : (
          <><Icon name="volume" size={17} /> Suno — hear the verdict in Hindi</>
        )}
      </button>
      <p className="mt-2.5 text-center text-[11px] text-ink3">
        {verdict.audio_b64 ? "Voice by Sarvam Bulbul TTS" : "Sample voice · live demo uses Sarvam Bulbul TTS"}
      </p>
    </motion.section>
  );
}
