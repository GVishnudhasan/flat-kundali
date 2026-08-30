// Dev-only: screenshots the three phases for visual review.
import { chromium } from "playwright-core";

const BASE = "http://localhost:3123";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.screenshot({ path: "shots/1-hero.png" });

// fill example and run
await page.getByText("Try the example").click();
await page.getByText("Match the Kundali").click();
await page.waitForTimeout(6500);
await page.screenshot({ path: "shots/2-running.png" });

// wait for verdict (mock run ~14s total)
await page.waitForSelector("text=The Verdict", { timeout: 30000 });
await page.waitForTimeout(2600);
await page.screenshot({ path: "shots/3-verdict.png" });
await page.screenshot({ path: "shots/4-verdict-full.png", fullPage: true });

await browser.close();
console.log("done");
