import type { Metadata } from "next";
import { Fraunces, Inter, Tiro_Devanagari_Hindi } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["opsz"],
});

const body = Inter({ subsets: ["latin"], variable: "--font-body" });

const deva = Tiro_Devanagari_Hindi({
  subsets: ["devanagari", "latin"],
  weight: "400",
  variable: "--font-deva",
});

export const metadata: Metadata = {
  title: "Flat Kundali — match your kundali with a flat's, before you sign",
  description:
    "Agentic due-diligence for Bengaluru rentals. Live web evidence by Anakin.io, Indian-language intelligence by Sarvam.ai.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} ${deva.variable} font-body antialiased`}>
        <div className="backdrop" />
        <div className="stars" />
        <div className="grain" />
        {children}
      </body>
    </html>
  );
}
