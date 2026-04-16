import { NextRequest, NextResponse } from "next/server";
import { checkCors } from "@/lib/cors";
import { summarizeSection } from "@/lib/summarize";
import { ConversationMessage } from "@/types/interview";

export async function POST(request: NextRequest) {
  const corsError = checkCors(request);
  if (corsError) return corsError;

  let sectionName: string;
  let messages: ConversationMessage[];
  try {
    const body = await request.json();
    sectionName = body.sectionName ?? "";
    messages = body.messages ?? [];
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!sectionName || !Array.isArray(messages)) {
    return NextResponse.json(
      { error: "sectionName and messages are required" },
      { status: 400 }
    );
  }

  try {
    const summary = await summarizeSection(sectionName, messages);
    return NextResponse.json({ summary });
  } catch (err) {
    console.error("[/api/summarize]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
