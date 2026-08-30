import { NextRequest, NextResponse } from "next/server";
import { MOCK_AGREEMENT } from "@/lib/mock";
import * as sarvam from "@/lib/sarvam";
import type { AgreementReport } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isMock = () => !process.env.SARVAM_API_KEY || process.env.MOCK === "1";

export async function POST(req: NextRequest) {
  const { pdfB64 } = (await req.json()) as { pdfB64?: string };

  // Mock mode, or the bundled sample from the example chip.
  if (isMock() || !pdfB64 || pdfB64 === "sample") {
    await new Promise((r) => setTimeout(r, 1600));
    return NextResponse.json(MOCK_AGREEMENT);
  }

  try {
    const text = (await sarvam.parsePdf(pdfB64)).slice(0, 12_000);
    const report = await sarvam.chatJSON<Omit<AgreementReport, "verdict_hi" | "audio_b64">>(
      `You review Indian 11-month rent agreements for predatory clauses (lock-in with deposit forfeiture, arbitrary painting/cleaning charges, escalation >5%, notice traps, entry rights). Also note genuinely tenant-friendly clauses.
Return JSON: {"score":<0 predatory – 6 clean>,"verdict_one_line":"<max 120 chars>","clauses":[{"quote":"<verbatim clause>","severity":"risk|caution|good","explanation":"<max 110 chars, what to do about it>"}]}. Max 5 clauses, worst first.`,
      text
    );
    const verdict_hi = await sarvam.translate(report.verdict_one_line, "hi-IN");
    const audio = await sarvam.tts(verdict_hi, "hi-IN").catch(() => null);
    return NextResponse.json({ ...report, verdict_hi, audio_b64: audio } satisfies AgreementReport);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Agreement analysis failed" },
      { status: 500 }
    );
  }
}
