"use client";

import { useRef, useState } from "react";

interface Props {
  onTranscript: (text: string) => void;
}

export default function MicButton({ onTranscript }: Props) {
  const [state, setState] = useState<"idle" | "recording" | "transcribing">("idle");
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const toggle = async () => {
    if (state === "recording") {
      recRef.current?.stop();
      return;
    }
    if (state !== "idle") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      recRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setState("transcribing");
        try {
          const form = new FormData();
          form.append("audio", new Blob(chunksRef.current, { type: "audio/webm" }));
          const res = await fetch("/api/transcribe", { method: "POST", body: form });
          const data = await res.json();
          if (data.text) onTranscript(data.text);
        } finally {
          setState("idle");
        }
      };
      rec.start();
      setState("recording");
    } catch {
      setState("idle");
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title="Speak your profile — Hinglish works (Sarvam Saarika STT)"
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors ${
        state === "recording"
          ? "rec-pulse border-risk/60 bg-risk/20 text-risk"
          : "border-gold/25 bg-black/30 text-gold hover:border-gold/50"
      }`}
    >
      {state === "transcribing" ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
      ) : state === "recording" ? (
        "■"
      ) : (
        "🎤"
      )}
    </button>
  );
}
