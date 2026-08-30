// Sarvam.ai REST client — server-side only.
// NOTE FOR VENUE: verify endpoint paths/fields against https://docs.sarvam.ai
// (they occasionally version fields). Everything is isolated here on purpose.

const BASE = "https://api.sarvam.ai";
const KEY = () => process.env.SARVAM_API_KEY || "";

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

/** Document AI: parse a PDF (base64) into text. Verify exact endpoint at venue. */
export async function parsePdf(b64: string): Promise<string> {
  const form = new FormData();
  const bytes = Buffer.from(b64, "base64");
  form.append("pdf", new Blob([bytes], { type: "application/pdf" }), "agreement.pdf");
  const res = await fetch(`${BASE}/parse/parsepdf`, {
    method: "POST",
    headers: { "api-subscription-key": KEY() },
    body: form,
  });
  if (!res.ok) throw new Error(`Sarvam Parse ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.output ?? data.text ?? JSON.stringify(data)) as string;
}
