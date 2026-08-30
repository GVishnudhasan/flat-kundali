// Minimal inline icon set (lucide-style, stroke-based, currentColor).
// ICON_PATHS is exported raw so the SVG kundali chart can inline the same
// glyphs without nesting <svg> elements.

export const ICON_PATHS: Record<string, string[]> = {
  droplet: ["M12 2.7C12 2.7 6 9.2 6 13.5a6 6 0 0 0 12 0C18 9.2 12 2.7 12 2.7Z"],
  route: [
    "M5.5 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
    "M18.5 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
    "M7.5 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h7.5",
  ],
  building: [
    "M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17",
    "M3 21h18",
    "M9 7h1.5", "M13.5 7H15", "M9 11h1.5", "M13.5 11H15", "M9 15h1.5", "M13.5 15H15",
    "M10.5 21v-3h3v3",
  ],
  rupee: ["M7 3h10", "M7 8h10", "M7 13h2.5", "M9.5 13c5.8 0 5.8-10 0-10", "M7 13l8 8"],
  alert: [
    "M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
    "M12 9.5v4.5", "M12 17.5h.01",
  ],
  leaf: [
    "M11 20A7 7 0 0 1 4 13C4 8 8 3.5 20 3.5c0 11.5-4.5 16.5-9 16.5Z",
    "M3.5 21C7 15 11 11.5 16 8.5",
  ],
  mic: [
    "M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z",
    "M19 11a7 7 0 0 1-14 0", "M12 18v4", "M8.5 22h7",
  ],
  link: [
    "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
    "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  ],
  file: [
    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z",
    "M14 2v6h6", "M9 13h6", "M9 17h6",
  ],
  volume: [
    "M11 5 6 9H3v6h3l5 4V5Z",
    "M15.5 8.5a5 5 0 0 1 0 7", "M18.5 5.5a9 9 0 0 1 0 13",
  ],
  search: ["M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z", "m21 21-4.35-4.35"],
  translate: ["m5 8 6 6", "m4 14 6-6 2-3", "M2 5h12", "M7 2h1", "m22 22-5-10-5 10", "M14 18h6"],
  check: ["m4.5 12.5 5 5L20 7"],
  stop: ["M7 7h10v10H7Z"],
  sparkle: ["M12 3v18", "M3 12h18", "m6 6 12 12", "m18 6-12 12"],
};

export function Icon({
  name,
  size = 16,
  className = "",
  strokeWidth = 1.7,
}: {
  name: keyof typeof ICON_PATHS;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block shrink-0 ${className}`}
      aria-hidden
    >
      {ICON_PATHS[name].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
