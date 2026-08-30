// Sarvam.ai REST client — server-side only.
// NOTE FOR VENUE: verify endpoint paths/fields against https://docs.sarvam.ai
// (they occasionally version fields). Everything is isolated here on purpose.

import { unzipSync, strFromU8 } from "fflate";

const BASE = "https://api.sarvam.ai";
const KEY = () => process.env.SARVAM_API_KEY || "";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function sarvamFetch(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "api-subscription-key": KEY(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Sarvam ${path} ${res.status}: ${await res.text()}`);
  return res.json();
}

/** Chat/reasoning with sarvam-m. Returns the assistant message content. */
export async function chat(system: string, user: string): Promise<string> {
  const res = await fetch(`${BASE}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY()}`,
      "api-subscription-key": KEY(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sarvam-105b",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.2,
      // Reasoning output counts against max_tokens — keep this high or
      // content comes back null with finish_reason "length".
      max_tokens: 8000,
      reasoning_effort: "low",
    }),
  });
  if (!res.ok) throw new Error(`Sarvam chat ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const msg = data.choices[0].message;
  // sarvam-105b can put everything in reasoning_content if output tokens run out.
  return (msg.content ?? msg.reasoning_content ?? "") as string;
}

/** Chat that must return JSON matching a described schema; one retry on bad parse. */
export async function chatJSON<T>(system: string, user: string): Promise<T> {
  const sys = `${system}\nRespond with ONLY valid JSON. No markdown fences, no prose.`;
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await chat(sys, user);
    // Models often wrap JSON in fences or prose — extract the outermost object.
    const candidates = [
      raw.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim(),
      raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1),
    ];
    for (const c of candidates) {
      try {
        return JSON.parse(c) as T;
      } catch {
        /* try next */
      }
    }
    if (attempt === 1) throw new Error("Sarvam returned unparseable JSON");
  }
  throw new Error("unreachable");
}

/** Translate arbitrary text (auto-detect source) into the target language. */
export async function translate(input: string, target = "hi-IN"): Promise<string> {
  const data = await sarvamFetch("/translate", {
    input,
    source_language_code: "auto",
    target_language_code: target,
  });
  return data.translated_text as string;
}

/** Text-to-speech via Bulbul. Returns base64 wav. */
export async function tts(text: string, language = "hi-IN"): Promise<string> {
  const data = await sarvamFetch("/text-to-speech", {
    text,
    target_language_code: language,
    model: "bulbul:v3",
    speaker: "priya",
  });
  return (data.audios?.[0] as string) ?? "";
}

/** Speech-to-text via Saarika. Accepts a webm/wav File from the browser. */
export async function stt(file: Blob): Promise<{ text: string; language: string }> {
  const form = new FormData();
  form.append("file", file, "audio.webm");
  form.append("model", "saarika:v2.5");
  const res = await fetch(`${BASE}/speech-to-text`, {
    method: "POST",
    headers: { "api-subscription-key": KEY() },
    body: form,
  });
  if (!res.ok) throw new Error(`Sarvam STT ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return { text: data.transcript as string, language: (data.language_code as string) ?? "unknown" };
}

/**
 * Document AI: digitise a PDF (base64) into markdown text.
 * Sarvam's old /parse/parsepdf endpoint is gone (404) — this uses the current
 * job-based Document AI flow: create → poll status → download-url → unzip.
 * https://docs.sarvam.ai/api-reference/doc-ai
 */
const DOC_AI = `${BASE}/doc-ai/v1/job`;
const TERMINAL = new Set(["completed", "partially_completed", "failed", "rejected"]);

export async function parsePdf(b64: string): Promise<string> {
  const bytes = Buffer.from(b64, "base64");

  // 1) Create + submit a digitise job (single call).
  const form = new FormData();
  form.append("file", new Blob([bytes], { type: "application/pdf" }), "agreement.pdf");
  form.append("language", "en-IN");
  form.append("output_format", "md");
  const created = await fetch(`${DOC_AI}/digitise`, {
    method: "POST",
    headers: { "api-subscription-key": KEY() },
    body: form,
  });
  if (!created.ok) throw new Error(`Sarvam digitise ${created.status}: ${await created.text()}`);
  const jobId = (await created.json()).job_id as string;
  if (!jobId) throw new Error("Sarvam digitise: no job_id in response");

  // 2) Poll until the job reaches a terminal state (max ~80s).
  let status = "";
  for (let i = 0; i < 40; i++) {
    await wait(2000);
    const res = await fetch(`${DOC_AI}/${jobId}/status`, {
      headers: { "api-subscription-key": KEY() },
    });
    if (!res.ok) throw new Error(`Sarvam status ${res.status}: ${await res.text()}`);
    status = (await res.json()).status as string;
    if (TERMINAL.has(status)) break;
  }
  if (status !== "completed" && status !== "partially_completed") {
    throw new Error(`Sarvam digitise did not finish (status: ${status || "timeout"})`);
  }

  // 3) Get a signed URL for the output artifact.
  const dlRes = await fetch(`${DOC_AI}/${jobId}/download-url`, {
    headers: { "api-subscription-key": KEY() },
  });
  if (!dlRes.ok) throw new Error(`Sarvam download-url ${dlRes.status}: ${await dlRes.text()}`);
  const dl = (await dlRes.json()) as { method?: string; url: string; headers?: Record<string, string> };

  // 4) Fetch the artifact. Digitise returns a ZIP (primary output + metadata +
  //    manifest); guard in case a raw file ever comes back instead.
  const artifact = await fetch(dl.url, { method: dl.method || "GET", headers: dl.headers || {} });
  if (!artifact.ok) throw new Error(`Sarvam artifact ${artifact.status}`);
  const buf = new Uint8Array(await artifact.arrayBuffer());

  const isZip = buf[0] === 0x50 && buf[1] === 0x4b; // "PK"
  if (!isZip) return strFromU8(buf);

  const files = unzipSync(buf);
  const names = Object.keys(files);
  const pick =
    names.find((n) => n.endsWith(".md")) ??
    names.find((n) => n.endsWith(".html")) ??
    names.find((n) => n.endsWith(".txt")) ??
    names.find((n) => n.endsWith(".json") && !/manifest|metadata/i.test(n));
  if (!pick) throw new Error(`Sarvam output: no readable file (${names.join(", ")})`);
  return strFromU8(files[pick]);
}
