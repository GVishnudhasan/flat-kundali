// Dev-only: screenshots the full journey for visual review (run against a MOCK server).
import { chromium } from "playwright-core";

const BASE = process.env.SHOOT_BASE || "http://localhost:3199";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(1600);
await page.screenshot({ path: "shots/1-landing.png" });

// voice mode → matches
await page.getByText("Try the example — Whitefield").click();
await page.getByText("Find my rishtas").click();
await page.waitForTimeout(6000);
await page.screenshot({ path: "shots/2-matching.png" });
await page.waitForSelector("text=Your rishtas, ranked", { timeout: 30000 });
await page.waitForTimeout(1800);
await page.screenshot({ path: "shots/3-ranked.png" });

// deep dive on rank #1
await page.getByText("Full kundali reading").first().click();
await page.waitForSelector("text=The Verdict", { timeout: 40000 });
await page.waitForTimeout(2600);
await page.screenshot({ path: "shots/4-deep.png" });

// agreement x-ray
await page.goto(BASE, { waitUntil: "networkidle" });
await page.getByText("Agreement X-Ray").click();
await page.getByText("Try the sample agreement").click();
await page.waitForSelector("text=Scan of", { timeout: 20000 });
await page.waitForTimeout(1200);
await page.screenshot({ path: "shots/5-agreement.png", fullPage: true });

await browser.close();
console.log("done");
