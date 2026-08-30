"use client";

import { motion } from "framer-motion";
import { useRef, useState } from "react";
import MicButton from "./MicButton";

export interface AnalyzeInput {
  listingUrl: string;
  profileText: string;
  agreementB64: string | null;
  agreementName: string | null;
}

const EXAMPLE = {
  listingUrl: "https://www.nobroker.in/sobha-dream-acres-2bhk",
  profileText: "Main Whitefield mein kaam karta hoon, do din WFH, ek dog hai, budget 30k tak.",
};

export default function InputPanel({
  onSubmit,
  disabled,
}: {
  onSubmit: (input: AnalyzeInput) => void;
  disabled: boolean;
}) {
  const [listingUrl, setListingUrl] = useState("");
  const [profileText, setProfileText] = useState("");
  const [agreement, setAgreement] = useState<{ name: string; b64: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (f: File | undefined) => {
    if (!f) return;
    if (f.size > 6 * 1024 * 1024) return alert("PDF must be under 6 MB");
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = String(reader.result).split(",")[1] ?? "";
      setAgreement({ name: f.name, b64 });
    };
    reader.readAsDataURL(f);
  };

  const fillExample = () => {
    setListingUrl(EXAMPLE.listingUrl);
    setProfileText(EXAMPLE.profileText);
    setAgreement({ name: "rent-agreement.pdf (sample)", b64: "sample" });
  };

  const canGo = listingUrl.trim().length > 8;

  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="glass w-full max-w-xl rounded-3xl p-7"
    >
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.22em] text-ink3">
        The flat · listing URL
      </label>
      <input
        value={listingUrl}
        onChange={(e) => setListingUrl(e.target.value)}
        placeholder="Paste a NoBroker / 99acres / MagicBricks link…"
        className="field w-full rounded-xl px-4 py-3 text-[14px] text-ink placeholder:text-ink3"
        spellCheck={false}
      />

      <label className="mb-1.5 mt-5 block text-[11px] font-semibold uppercase tracking-[0.22em] text-ink3">
        You · speak or type your life in one line
      </label>
      <div className="flex items-start gap-2.5">
        <textarea
          value={profileText}
          onChange={(e) => setProfileText(e.target.value)}
          placeholder='"Main Whitefield mein kaam karta hoon, ek dog hai, budget 30k…"'
          rows={2}
          className="field w-full resize-none rounded-xl px-4 py-3 text-[14px] text-ink placeholder:text-ink3"
        />
        <MicButton onTranscript={(t) => setProfileText((p) => (p ? `${p} ${t}` : t))} />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 rounded-xl border border-gold/20 bg-black/25 px-4 py-2.5 text-[12.5px] text-ink2 transition-colors hover:border-gold/45"
        >
          📜 {agreement ? agreement.name : "Attach rent agreement (optional PDF)"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        {agreement && (
          <button type="button" onClick={() => setAgreement(null)} className="text-[12px] text-ink3 hover:text-risk">
            remove
          </button>
        )}
      </div>

      <button
        disabled={!canGo || disabled}
        onClick={() =>
          onSubmit({
            listingUrl: listingUrl.trim(),
            profileText: profileText.trim(),
            agreementB64: agreement?.b64 ?? null,
            agreementName: agreement?.name ?? null,
          })
        }
        className="btn-gold mt-6 w-full rounded-xl px-6 py-4 text-[15px] font-bold tracking-wide"
      >
        ✦ Match the Kundali
      </button>

      <button
        type="button"
        onClick={fillExample}
        className="mx-auto mt-4 block text-[12.5px] text-ink3 underline decoration-gold/30 underline-offset-4 transition-colors hover:text-gold"
      >
        Try the example — Sobha Dream Acres, Panathur · 2 BHK · ₹28k
      </button>
    </motion.div>
  );
}
