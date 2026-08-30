import type { HouseKey } from "./types";

export interface HouseDef {
  key: HouseKey;
  label: string;
  hindi: string;
  emoji: string;
  // kundali chart region: polygon points + content anchor
  points: string;
  anchor: [number, number];
}

// Geometry for a 640x640 North-Indian kundali chart.
// Outer square (20,20)→(620,620); inner rotated square on edge midpoints;
// diagonals corner-to-corner. Diamonds + corner triangles become the houses.
export const HOUSES: HouseDef[] = [
  {
    key: "water",
    label: "Water",
    hindi: "जल",
    emoji: "💧",
    points: "20,20 320,20 20,320",
    anchor: [118, 112],
  },
  {
    key: "commute",
    label: "Commute",
    hindi: "यात्रा",
    emoji: "🚦",
    points: "620,20 320,20 620,320",
    anchor: [522, 112],
  },
  {
    key: "society",
    label: "Society",
    hindi: "समाज",
    emoji: "🏢",
    points: "20,320 170,170 320,320 170,470",
    anchor: [163, 320],
  },
  {
    key: "price",
    label: "Price",
    hindi: "मूल्य",
    emoji: "💰",
    points: "620,320 470,170 320,320 470,470",
    anchor: [477, 320],
  },
  {
    key: "redflags",
    label: "Red Flags",
    hindi: "दोष",
    emoji: "⚠️",
    points: "20,620 20,320 320,620",
    anchor: [118, 528],
  },
  {
    key: "livability",
    label: "Livability",
    hindi: "जीवन",
    emoji: "🌳",
    points: "620,620 620,320 320,620",
    anchor: [522, 528],
  },
  {
    key: "agreement",
    label: "Agreement",
    hindi: "अनुबंध",
    emoji: "📜",
    points: "320,620 170,470 320,320 470,470",
    anchor: [320, 470],
  },
];

// The top diamond is the "lagna" — house of the self. It holds the listing identity.
export const SELF_DIAMOND = "320,20 470,170 320,320 170,170";

export const scoreStatus = (score: number, dealbreaker: boolean) =>
  dealbreaker || score < 3 ? "risk" : score < 4.5 ? "caution" : "good";

export const scoreWord = (score: number, dealbreaker: boolean) =>
  dealbreaker ? "Dealbreaker" : score < 3 ? "Weak" : score < 4.5 ? "Mixed" : "Strong";
