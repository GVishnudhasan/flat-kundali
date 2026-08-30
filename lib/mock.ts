import type { AgreementReport, AnalyzeEvent, MatchCandidate, MatchEvent } from "./types";

// ============================================================
// Scripted deep-dive run (Sobha Dream Acres). Used in MOCK mode
// and for the fictional demo URL. Panathur's tanker dependency
// is real & widely reported — authentic demo data.
// Each entry: [delay-ms-after-previous, event]
// ============================================================
export const MOCK_RUN: Array<[number, AnalyzeEvent]> = [
  [300, { type: "status", message: "Reading listing…" }],
  [500, { type: "agent_log", message: "Anakin · scraping listing page → markdown", tone: "scrape" }],
  [1400, {
    type: "listing_ready",
    listing: {
      society: "Sobha Dream Acres",
      locality: "Panathur, Bengaluru East",
      bhk: "2 BHK",
      rent: 28000,
      deposit: 200000,
      sqft: 1010,
      url: "https://www.nobroker.in/sobha-dream-acres-2bhk",
    },
  }],
  [200, { type: "agent_log", message: "Sarvam · profile matched: office Whitefield · budget ₹30k · 1 dog", tone: "reason" }],
  [300, { type: "house_running", house: "water" }],
  [80, { type: "house_running", house: "commute" }],
  [80, { type: "house_running", house: "society" }],
  [80, { type: "house_running", house: "price" }],
  [80, { type: "house_running", house: "redflags" }],
  [80, { type: "house_running", house: "livability" }],
  [600, { type: "agent_log", message: "Anakin · search: \"Panathur water shortage tanker borewell 2026\"", tone: "search" }],
  [500, { type: "agent_log", message: "Anakin · search: \"Panathur to Whitefield commute traffic time\"", tone: "search" }],
  [500, { type: "agent_log", message: "Anakin · search: \"Sobha Dream Acres resident reviews complaints\"", tone: "search" }],
  [700, { type: "agent_log", message: "Anakin · scraping citizenmatters.in/panathur-water-crisis…", tone: "scrape" }],
  [900, { type: "agent_log", message: "Sarvam Translate · Kannada source (Vijaya Karnataka) → English", tone: "translate" }],
  [700, {
    type: "house_complete",
    result: {
      house: "price",
      score: 5,
      verdict_one_line: "₹27.7/sqft is fair — 3 comparable 2BHKs in the tower list at ₹28–31k.",
      evidence: [
        { quote: "2 BHK 1010 sqft, ₹29,500, immediate move-in", source_name: "NoBroker · live comparable", url: "https://www.nobroker.in" },
        { quote: "2 BHK 995 sqft, ₹28,000, semi-furnished", source_name: "MagicBricks · live comparable", url: "https://www.magicbricks.com" },
      ],
      dealbreaker: false,
    },
  }],
  [900, {
    type: "house_complete",
    result: {
      house: "water",
      score: 2,
      verdict_one_line: "Panathur has no Cauvery connection — society runs on tankers & borewells; summer cuts reported.",
      evidence: [
        { quote: "Residents of Panathur–Balagere belt spent ₹4,000+ per month on tanker water last summer", source_name: "Citizen Matters", url: "https://citizenmatters.in" },
        { quote: "ಪನತ್ತೂರು: ಟ್ಯಾಂಕರ್ ನೀರಿಗೆ ದುಬಾರಿ ದರ… (translated: 'Panathur: steep rates for tanker water')", source_name: "Vijaya Karnataka · translated by Sarvam", url: "https://vijaykarnataka.com" },
      ],
      dealbreaker: false,
    },
  }],
  [800, {
    type: "house_complete",
    result: {
      house: "commute",
      score: 3,
      verdict_one_line: "6.5 km to Whitefield ≈ 40–55 min peak on Outer Ring Road; metro not walkable yet.",
      evidence: [
        { quote: "Panathur Junction consistently ranks among ORR's worst evening chokepoints", source_name: "Deccan Herald", url: "https://www.deccanherald.com" },
      ],
      dealbreaker: false,
    },
  }],
  [700, {
    type: "house_complete",
    result: {
      house: "society",
      score: 4,
      verdict_one_line: "Large, active RWA; maintenance praised, but residents flag lift wait-times in T-series towers.",
      evidence: [
        { quote: "Well maintained for its size, gym and pool actually usable — lifts are the pain point", source_name: "Reddit r/bangalore", url: "https://reddit.com/r/bangalore" },
      ],
      dealbreaker: false,
    },
  }],
  [800, {
    type: "house_complete",
    result: {
      house: "redflags",
      score: 3,
      verdict_one_line: "No litigation found; Balagere road flooding in Oct 2025 affected access for 2 days.",
      evidence: [
        { quote: "Waterlogging on Balagere Road left residents wading to the main gate", source_name: "The Hindu", url: "https://www.thehindu.com" },
      ],
      dealbreaker: false,
    },
  }],
  [700, {
    type: "house_complete",
    result: {
      house: "livability",
      score: 5,
      verdict_one_line: "Strong: supermarkets, clinics & 20+ restaurants within 1.5 km; lakeside walking track. Pet-friendly society per house rules.",
      evidence: [
        { quote: "Dream Acres allows pets; dedicated pet zone added in 2024", source_name: "Society noticeboard (scraped)", url: "https://www.sobhadreamacres.com" },
      ],
      dealbreaker: false,
    },
  }],
  [600, { type: "agent_log", message: "Sarvam · matching 6 houses against your profile…", tone: "reason" }],
  [1300, {
    type: "verdict",
    verdict: {
      guna: 22,
      label: "Proceed with caution",
      verdict_hi:
        "यह घर आपके बजट में अच्छा सौदा है और कुत्ते के लिए भी अनुकूल है। सबसे बड़ी ताकत — किराया उचित है और आस-पास की सुविधाएं बेहतरीन हैं। सबसे बड़ा जोखिम — पानी टैंकर पर निर्भर है, गर्मियों में हर महीने चार हज़ार तक अतिरिक्त खर्च हो सकता है। साइन करने से पहले सोसाइटी से पानी के चार्ज ज़रूर पूछें।",
      verdict_en:
        "Good value for your budget and genuinely pet-friendly — amenities are the strength. The biggest risk is tanker-dependent water: summers can add ₹4k/month. Ask the society for last summer's water charges before signing.",
      audio_b64: null,
    },
  }],
];

// ============================================================
// Scripted matchmaking run — realistic Whitefield-belt candidates.
// ============================================================
export const MOCK_CANDIDATES: MatchCandidate[] = [
  {
    id: "c1",
    society: "Prestige Lakeside Habitat",
    locality: "Varthur",
    bhk: "2 BHK",
    rent: 31000,
    url: "https://www.nobroker.in/prestige-lakeside-habitat-2bhk",
    source_name: "NoBroker",
    featured: false,
    guna: 29,
    reasons: ["15 min to Whitefield via Varthur Rd", "Dog park inside the society", "Cauvery + treated-water mix, low tanker use"],
    dealbreaker: null,
  },
  {
    id: "c2",
    society: "Sobha Dream Acres",
    locality: "Panathur",
    bhk: "2 BHK",
    rent: 28000,
    url: "https://www.nobroker.in/sobha-dream-acres-2bhk",
    source_name: "NoBroker",
    featured: false, // flipped to true in link mode
    guna: 26,
    reasons: ["₹2k under your budget", "Dedicated pet zone since 2024", "Water is tanker-dependent — ask about summer charges"],
    dealbreaker: null,
  },
  {
    id: "c3",
    society: "Godrej United",
    locality: "Mahadevapura",
    bhk: "2 BHK",
    rent: 30000,
    url: "https://housing.com/godrej-united-2bhk",
    source_name: "Housing.com",
    featured: false,
    guna: 24,
    reasons: ["25 min ORR commute to Whitefield", "Well-reviewed society, responsive RWA", "Exactly at budget — no headroom"],
    dealbreaker: null,
  },
  {
    id: "c4",
    society: "DivyaSree Republic of Whitefield",
    locality: "Whitefield",
    bhk: "2 BHK",
    rent: 33000,
    url: "https://www.rentmystay.com/divyasree-rw-2bhk",
    source_name: "rentmystay.com",
    featured: false,
    guna: 21,
    reasons: ["Walk-to-office possible", "₹3k over your budget", "Residents flag lift queues at peak hours"],
    dealbreaker: null,
  },
  {
    id: "c5",
    society: "Purva Fountain Square",
    locality: "Marathahalli",
    bhk: "2 BHK",
    rent: 27000,
    url: "https://www.99acres.com/purva-fountain-square-2bhk",
    source_name: "99acres",
    featured: false,
    guna: 14,
    reasons: ["Cheapest of the lot", "Marathahalli junction: 50+ min peak commute"],
    dealbreaker: "Acute tanker dependence — society had 3-day dry spell in March 2026",
  },
];

export function buildMockMatchRun(linkMode: boolean): Array<[number, MatchEvent]> {
  const cands = MOCK_CANDIDATES.map((c) => ({
    ...c,
    featured: linkMode && c.id === "c2",
    // the user's own link gets a visibility boost in ranking
    guna: linkMode && c.id === "c2" ? (c.guna ?? 0) + 3 : c.guna,
  }));
  const order = [...cands].sort((a, b) => (b.guna ?? 0) - (a.guna ?? 0)).map((c) => c.id);

  const events: Array<[number, MatchEvent]> = [
    [400, { type: "match_log", message: "Sarvam · reading your requirements…", tone: "reason" }],
    [1100, {
      type: "intent_ready",
      intent: {
        locality: "Whitefield belt",
        bhk: "2 BHK",
        budget: 30000,
        pets: true,
        office: "Whitefield",
        language: "hi-IN",
        summary: "2 BHK near Whitefield · budget ₹30k · dog-friendly",
      },
    }],
    [500, { type: "match_log", message: "Anakin · sweeping 6 platforms in parallel: nobroker, magicbricks, housing, 99acres, rentmystay, squareyards…", tone: "search" }],
    [800, { type: "match_log", message: "Anakin · 5 live listings found across 4 platforms", tone: "search" }],
  ];
  if (linkMode) {
    events.push([400, { type: "match_log", message: "Anakin · scraping your link → anchoring the search around Panathur", tone: "scrape" }]);
  }
  cands.forEach((c, i) => {
    const { guna, reasons, dealbreaker, ...found } = c;
    events.push([i === 0 ? 900 : 450, { type: "candidate_found", candidate: found as MatchCandidate }]);
  });
  events.push([600, { type: "match_log", message: "Anakin · scraping 5 listing pages in parallel…", tone: "scrape" }]);
  // score in a scattered order so the reorder animation shows
  const scoreOrder = ["c3", "c1", "c5", "c2", "c4"];
  scoreOrder.forEach((id, i) => {
    const c = cands.find((x) => x.id === id)!;
    events.push([i === 0 ? 1200 : 900, {
      type: "candidate_scored",
      id,
      guna: c.guna ?? 0,
      reasons: c.reasons ?? [],
      dealbreaker: c.dealbreaker ?? null,
    }]);
  });
  events.push([700, { type: "match_log", message: "Sarvam · final gun-milan across 5 rishtas…", tone: "reason" }]);
  events.push([900, { type: "ranked", order }]);
  return events;
}

// ============================================================
// Scripted Agreement X-Ray report.
// ============================================================
export const MOCK_AGREEMENT: AgreementReport = {
  score: 2,
  verdict_one_line: "Two predatory clauses and one trap — negotiate clauses 7, 11 and 14 before signing.",
  clauses: [
    {
      quote: "Clause 7: In the event tenant vacates within six months, the entire security deposit shall stand forfeited.",
      severity: "risk",
      explanation: "Full-deposit forfeiture on a 6-month lock-in is far beyond market norm (usually one month's rent).",
    },
    {
      quote: "Clause 11: A painting and deep-cleaning charge of ₹15,000 shall be deducted from the deposit at exit.",
      severity: "risk",
      explanation: "Flat charge regardless of condition — should be actuals with receipts, capped.",
    },
    {
      quote: "Clause 14: Rent shall escalate by 10% upon renewal.",
      severity: "caution",
      explanation: "10% is above the 5% Bengaluru standard — counter with 5%.",
    },
    {
      quote: "Clause 9: Landlord shall provide 24-hour notice before any inspection visit.",
      severity: "good",
      explanation: "Proper notice period — protects your privacy.",
    },
  ],
  verdict_hi:
    "इस अनुबंध में दो खतरनाक शर्तें हैं — छह महीने के लॉक-इन पर पूरी जमा राशि ज़ब्त, और पंद्रह हज़ार का फिक्स पेंटिंग चार्ज। साइन करने से पहले क्लॉज़ सात, ग्यारह और चौदह पर मोलभाव ज़रूर करें।",
  audio_b64: null,
};
