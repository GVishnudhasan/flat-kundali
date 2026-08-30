import type { AnalyzeEvent } from "./types";

// A realistic, pre-scripted run used when API keys are absent (MOCK mode)
// and as the cached demo path. Sobha Dream Acres / Panathur is a real,
// widely-reported tanker-dependent locality — authentic demo data.
// Each entry: [delay-ms-after-previous, event]
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
  [200, { type: "agent_log", message: "Sarvam-M · profile parsed: office Whitefield · budget ₹30k · 1 dog", tone: "reason" }],
  [300, { type: "house_running", house: "water" }],
  [80, { type: "house_running", house: "commute" }],
  [80, { type: "house_running", house: "society" }],
  [80, { type: "house_running", house: "price" }],
  [80, { type: "house_running", house: "redflags" }],
  [80, { type: "house_running", house: "livability" }],
  [80, { type: "house_running", house: "agreement" }],
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
  [400, { type: "agent_log", message: "Sarvam Parse · rent-agreement.pdf → 14 clauses extracted", tone: "reason" }],
  [1100, {
    type: "house_complete",
    result: {
      house: "agreement",
      score: 2,
      verdict_one_line: "Two predatory clauses: 6-month lock-in with full-deposit forfeiture, and ₹15k 'painting charge' deducted regardless of condition.",
      evidence: [
        { quote: "Clause 7: In the event tenant vacates within six months, the entire security deposit shall stand forfeited", source_name: "rent-agreement.pdf · Sarvam Parse", url: "#" },
        { quote: "Clause 11: A painting and deep-cleaning charge of ₹15,000 shall be deducted from the deposit at exit", source_name: "rent-agreement.pdf · Sarvam Parse", url: "#" },
      ],
      dealbreaker: true,
    },
  }],
  [600, { type: "agent_log", message: "Sarvam-M · matching 7 houses against your profile…", tone: "reason" }],
  [1300, {
    type: "verdict",
    verdict: {
      guna: 21,
      label: "Proceed with caution",
      verdict_hi:
        "यह घर आपके बजट में अच्छा सौदा है और कुत्ते के लिए भी अनुकूल है, लेकिन दो बातें ध्यान रखें — पानी टैंकर पर निर्भर है, और अनुबंध में छह महीने का लॉक-इन है जिसमें पूरी जमा राशि ज़ब्त हो सकती है। साइन करने से पहले क्लॉज़ 7 और 11 पर मोलभाव ज़रूर करें।",
      verdict_en:
        "Good value for your budget and genuinely pet-friendly — but water is tanker-dependent, and the agreement's 6-month lock-in can forfeit your entire ₹2L deposit. Negotiate clauses 7 and 11 before signing.",
      audio_b64: null,
    },
  }],
];
