// Anakin.io REST client — server-side only.
// Endpoints follow the event handbook's documented patterns.

const BASE = "https://api.anakin.io/v1";
const KEY = () => process.env.ANAKIN_API_KEY || "";

async function anakinFetch(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "X-API-Key": KEY(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Anakin ${path} ${res.status}: ${await res.text()}`);
  return res.json();
}

export interface SearchResult {
  title: string;
  url: string;
  snippet?: string;
}

/** Live web search with fresh sources. */
export async function search(prompt: string, limit = 4): Promise<SearchResult[]> {
  const data = await anakinFetch("/search", { prompt, limit });
  const results = (data.results ?? []) as Array<Record<string, string>>;
  return results.map((r) => ({
    title: r.title ?? r.name ?? "",
    url: r.url ?? r.link ?? "",
    snippet: r.snippet ?? r.description ?? "",
  }));
}

/** Scrape one URL into markdown. Anakin's scraper is job-based: submit, then poll. */
export async function scrape(url: string, timeoutMs = 25_000): Promise<string> {
  const job = await anakinFetch("/url-scraper", { url, formats: ["markdown"] });
  const jobId = job.jobId ?? job.id;
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const res = await fetch(`${BASE}/url-scraper/${jobId}`, {
      headers: { "X-API-Key": KEY() },
    });
    if (!res.ok) throw new Error(`Anakin job ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (data.status === "completed") return (data.markdown ?? data.html ?? "") as string;
    if (data.status === "failed") throw new Error("Anakin scrape job failed");
    if (Date.now() > deadline) throw new Error("Anakin scrape timeout");
    await new Promise((r) => setTimeout(r, 900));
  }
}
