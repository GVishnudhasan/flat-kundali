"use client";

import { motion } from "framer-motion";
import { useRef, useState } from "react";
import type { AgreementReport } from "@/lib/types";

const SEV: Record<string, { chip: string; label: string; icon: string }> = {
  risk: { chip: "border-risk/40 text-risk", label: "Predatory", icon: "⚠" },
  caution: { chip: "border-caution/40 text-caution", label: "Negotiate", icon: "△" },
  good: { chip: "border-good/40 text-good", label: "Fair", icon: "✓" },
};

export default function AgreementXray({ onBack }: { onBack: () => void }) {
  const [state, setState] = useState<"idle" | "scanning" | "done" | "error">("idle");
  const [report, setReport] = useState<AgreementReport | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const scan = async (b64: string, name: string) => {
    setFileName(name);
    setState("scanning");
    try {
      const res = await fetch("/api/agreement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfB64: b64 }),
      });
      if (!res.ok) throw new Error();
      setReport(await res.json());
      setState("done");
    } catch {
      setState("error");
    }
  };

  const onFile = (f: File | undefined) => {
    if (!f) return;
    if (f.size > 6 * 1024 * 1024) return alert("PDF must be under 6 MB");
    const reader = new FileReader();
    reader.onload = () => scan(String(reader.result).split(",")[1] ?? "", f.name);
    reader.readAsDataURL(f);
  };

  const play = () => {
    if (!report) return;
    if (playing) {
      window.speechSynthesis?.cancel();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    if (report.audio_b64) {
      const a = new Audio(`data:audio/wav;base64,${report.audio_b64}`);
      a.onended = () => setPlaying(false);
      a.play();
    } else {
      const u = new SpeechSynthesisUtterance(report.verdict_hi);
      u.lang = "hi-IN";
      u.rate = 0.95;
      u.onend = () => setPlaying(false);
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto max-w-2xl pt-10"
    >
      <button onClick={onBack} className="mb-6 text-[12.5px] text-ink3 hover:text-gold">
        ← Back
      </button>
      <div className="mb-2 flex items-center gap-3">
        <span className="text-2xl">📜</span>
        <h1 className="font-display text-[34px] text-ink">Agreement X-Ray</h1>
      </div>
      <p className="mb-8 text-[14px] leading-relaxed text-ink2">
        Drop your 11-month rent agreement. Sarvam&rsquo;s Document AI reads every clause, flags the
        predatory ones, and speaks the verdict in Hindi.
      </p>

      {state !== "done" && (
        <div className="glass rounded-3xl p-8 text-center">
          {state === "scanning" ? (
            <div className="py-8">
              <motion.div
                className="mx-auto mb-5 h-10 w-10 rounded-full border-2 border-gold/25 border-t-gold"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <p className="text-[13.5px] text-ink2">Sarvam Parse · extracting clauses from {fileName}…</p>
            </div>
          ) : (
            <>
              <button
                onClick={() => fileRef.current?.click()}
                className="field mx-auto flex w-full max-w-md flex-col items-center gap-2 rounded-2xl border-dashed px-6 py-10 hover:!border-gold/45"
              >
                <span className="text-3xl">📄</span>
                <span className="text-[14px] font-medium text-ink">Drop your agreement PDF</span>
                <span className="text-[12px] text-ink3">or click to browse · under 6 MB</span>
              </button>
              <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
              <button
                onClick={() => scan("sample", "rent-agreement-sample.pdf")}
                className="mt-5 text-[12.5px] text-ink3 underline decoration-gold/30 underline-offset-4 hover:text-gold"
              >
                Try the sample agreement
              </button>
              {state === "error" && (
                <p className="mt-4 text-[12.5px] text-risk">△ Couldn&rsquo;t analyze that PDF — try another export.</p>
              )}
            </>
          )}
        </div>
      )}

      {state === "done" && report && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="glass rounded-2xl p-6">
            <div className="mb-3 flex items-center justify-between gap-4">
              <h2 className="font-display text-[20px] text-ink">Scan of {fileName}</h2>
              <span className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-widest ${
                report.score >= 4.5 ? "border-good/40 text-good" : report.score >= 3 ? "border-caution/40 text-caution" : "border-risk/40 text-risk"
              }`}>
                {report.score}/6 · {report.score >= 4.5 ? "clean" : report.score >= 3 ? "negotiate" : "predatory"}
              </span>
            </div>
            <p className="text-[14px] leading-relaxed text-ink2">{report.verdict_one_line}</p>
            <button onClick={play} className="btn-gold mt-4 w-full rounded-xl px-5 py-3 text-[13.5px] font-semibold">
              {playing ? "◼ Playing…" : "🔊 Suno — verdict in Hindi"}
            </button>
          </div>

          {report.clauses.map((cl, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className={`glass rounded-2xl p-5 ${cl.severity === "risk" ? "!border-risk/35" : ""}`}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className={`rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-widest ${SEV[cl.severity].chip}`}>
                  {SEV[cl.severity].icon} {SEV[cl.severity].label}
                </span>
              </div>
              <p className="text-[13px] italic leading-relaxed text-ink">&ldquo;{cl.quote}&rdquo;</p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-ink2">{cl.explanation}</p>
            </motion.div>
          ))}

          <button
            onClick={() => {
              setState("idle");
              setReport(null);
            }}
            className="w-full rounded-xl border border-gold/25 bg-black/25 px-5 py-3 text-[13px] text-ink2 hover:border-gold/50 hover:text-ink"
          >
            ↺ Scan another agreement
          </button>
        </motion.div>
      )}
    </motion.section>
  );
}
