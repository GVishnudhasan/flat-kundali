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
// diagonals corner-to-corner. Six houses × 6 guna = a perfect 36.
// Top diamond = the flat (lagna) · bottom diamond = the tenant (you).
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
];

// Top diamond — the flat under review (lagna, house of the subject).
export const SELF_DIAMOND = "320,20 470,170 320,320 170,170";
// Bottom diamond — the tenant. Kundali matching is between two parties.
export const YOU_DIAMOND = "320,620 170,470 320,320 470,470";

export const scoreStatus = (score: number, dealbreaker: boolean) =>
  dealbreaker || score < 3 ? "risk" : score < 4.5 ? "caution" : "good";

export const scoreWord = (score: number, dealbreaker: boolean) =>
  dealbreaker ? "Dealbreaker" : score < 3 ? "Weak" : score < 4.5 ? "Mixed" : "Strong";

// Guna (0–36) → status band, shared by match cards and the medallion.
export const gunaStatus = (guna: number) => (guna >= 27 ? "good" : guna >= 18 ? "caution" : "risk");
