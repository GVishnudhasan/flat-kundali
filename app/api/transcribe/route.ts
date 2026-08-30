import { NextRequest, NextResponse } from "next/server";
import { stt } from "@/lib/sarvam";

export const runtime = "nodejs";

const MOCK_TRANSCRIPT =
  "Main Whitefield mein kaam karta hoon, do din WFH, ek dog hai, budget 30k tak.";

export async function POST(req: NextRequest) {
  const isMock = !process.env.SARVAM_API_KEY || process.env.MOCK === "1";
  if (isMock) {
    await new Promise((r) => setTimeout(r, 900));
    return NextResponse.json({ text: MOCK_TRANSCRIPT, language: "hi-IN", mock: true });
  }
  try {
    const form = await req.formData();
    const file = form.get("audio");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "no audio" }, { status: 400 });
    }
    const result = await stt(file);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "STT failed" },
      { status: 500 }
    );
  }
}
