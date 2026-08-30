export type HouseKey =
  | "water"
  | "commute"
  | "society"
  | "price"
  | "redflags"
  | "livability";

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
  guna: number; // out of 36 (6 houses × 6)
  label: string;
  verdict_hi: string;
  verdict_en: string;
  audio_b64: string | null;
}

// ---- deep-dive SSE events ----
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
}

// ---- matchmaking (ranked search) ----
export interface Intent {
  locality: string;
  bhk: string;
  budget: number | null;
  pets: boolean;
  office: string;
  language: string;
  summary: string; // one human-readable line, shown in the UI + You-diamond
}

export interface MatchCandidate {
  id: string;
  society: string;
  locality: string;
  bhk: string;
  rent: number;
  url: string;
  source_name: string;
  featured: boolean; // true for the user's own link (mode B)
  // filled after scoring:
  guna?: number; // 0–36
  reasons?: string[];
  dealbreaker?: string | null;
}

export type MatchEvent =
  | { type: "match_log"; message: string; tone?: "search" | "scrape" | "reason" | "warn" }
  | { type: "intent_ready"; intent: Intent }
  | { type: "candidate_found"; candidate: MatchCandidate }
  | {
      type: "candidate_scored";
      id: string;
      guna: number;
      reasons: string[];
      dealbreaker: string | null;
      // facts extracted from the scraped listing page (optional refinements)
      society?: string;
      locality?: string;
      rent?: number;
    }
  | { type: "candidate_failed"; id: string }
  | { type: "ranked"; order: string[] }
  | { type: "error"; message: string };

export interface MatchRequest {
  mode: "link" | "voice";
  listingUrl?: string;
  requirements: string;
}

// ---- standalone Agreement X-Ray ----
export interface AgreementClause {
  quote: string;
  severity: "risk" | "caution" | "good";
  explanation: string;
}

export interface AgreementReport {
  score: number; // 0–6, clean-ness
  verdict_one_line: string;
  clauses: AgreementClause[];
  verdict_hi: string;
  audio_b64: string | null;
}
