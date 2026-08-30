export type HouseKey =
  | "water"
  | "commute"
  | "society"
  | "price"
  | "redflags"
  | "livability"
  | "agreement";

export type HouseStatus = "pending" | "running" | "complete" | "failed";

export interface Evidence {
  quote: string;
  source_name: string;
  url: string;
}

export interface HouseResult {
  house: HouseKey;
  score: number; // 0–6 guna
  verdict_one_line: string;
  evidence: Evidence[];
  dealbreaker: boolean;
}

export interface Listing {
  society: string;
  locality: string;
  bhk: string;
  rent: number;
  deposit: number;
  sqft: number;
  url: string;
}

export interface Verdict {
  guna: number; // out of 36
  label: string; // e.g. "Proceed with caution"
  verdict_hi: string;
  verdict_en: string;
  audio_b64: string | null; // base64 wav from Sarvam TTS, null in mock
}

// ---- SSE event envelope ----
export type AnalyzeEvent =
  | { type: "status"; message: string }
  | { type: "agent_log"; message: string; tone?: "search" | "scrape" | "translate" | "reason" | "warn" }
  | { type: "listing_ready"; listing: Listing }
  | { type: "house_running"; house: HouseKey }
  | { type: "house_complete"; result: HouseResult }
  | { type: "house_failed"; house: HouseKey; reason: string; search_url: string }
  | { type: "verdict"; verdict: Verdict }
  | { type: "error"; message: string };

export interface AnalyzeRequest {
  listingUrl: string;
  profileText: string;
  agreementB64?: string | null;
  agreementName?: string | null;
}
