import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { MOCK_RUN } from "@/lib/mock";
import { runPipeline } from "@/lib/pipeline";
import type { AnalyzeEvent, AnalyzeRequest } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_DIR = path.join(process.cwd(), ".cache");
const isMock = () => !process.env.SARVAM_API_KEY || !process.env.ANAKIN_API_KEY || process.env.MOCK === "1";

const sse = (e: AnalyzeEvent) => `data: ${JSON.stringify(e)}\n\n`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function readCache(key: string): Promise<Array<[number, AnalyzeEvent]> | null> {
  try {
    const raw = await fs.readFile(path.join(CACHE_DIR, `${key}.json`), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as AnalyzeRequest;
  const key = createHash("sha1").update(body.listingUrl || "demo").digest("hex").slice(0, 16);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (e: AnalyzeEvent) => controller.enqueue(encoder.encode(sse(e)));

      try {
        // 1) Mock mode or the fictional example URL → scripted cinematic replay.
        // 2) Cache hit → replay a previous real run (wifi-proof demo).
        // 3) Otherwise → live agentic pipeline; record it into the cache.
        const isDemoUrl = body.listingUrl.includes("sobha-dream-acres-2bhk");
        const replay = isMock() || isDemoUrl ? MOCK_RUN : await readCache(key);

        if (replay) {
          for (const [delay, event] of replay) {
            await sleep(Math.min(delay, 1500));
            emit(event);
          }
        } else {
          const recorded: Array<[number, AnalyzeEvent]> = [];
          let last = Date.now();
          await runPipeline(body, (e) => {
            const now = Date.now();
            recorded.push([now - last, e]);
            last = now;
            emit(e);
          });
          await fs.mkdir(CACHE_DIR, { recursive: true });
          await fs.writeFile(path.join(CACHE_DIR, `${key}.json`), JSON.stringify(recorded));
        }
      } catch (err) {
        emit({ type: "error", message: err instanceof Error ? err.message : "Pipeline failed" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
