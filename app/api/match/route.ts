import { NextRequest } from "next/server";
import { buildMockMatchRun } from "@/lib/mock";
import { runMatchmaker } from "@/lib/matchmaker";
import type { MatchEvent, MatchRequest } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isMock = () => !process.env.SARVAM_API_KEY || !process.env.ANAKIN_API_KEY || process.env.MOCK === "1";

const sse = (e: MatchEvent) => `data: ${JSON.stringify(e)}\n\n`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: NextRequest) {
  const body = (await req.json()) as MatchRequest;
  const isDemo =
    isMock() || (body.listingUrl ?? "").includes("sobha-dream-acres-2bhk") ||
    body.requirements.includes("do din WFH"); // the example chip's exact sentence

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (e: MatchEvent) => controller.enqueue(encoder.encode(sse(e)));
      try {
        if (isDemo) {
          for (const [delay, event] of buildMockMatchRun(body.mode === "link")) {
            await sleep(Math.min(delay, 1500));
            emit(event);
          }
        } else {
          await runMatchmaker(body, emit);
        }
      } catch (err) {
        emit({ type: "error", message: err instanceof Error ? err.message : "Matchmaking failed" });
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
