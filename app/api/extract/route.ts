import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkCors } from "@/lib/cors";
import { ConversationMessage } from "@/types/interview";
import { AGENT } from "@/lib/agent.config";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  const corsError = checkCors(request);
  if (corsError) return corsError;

  let compressedHistory: ConversationMessage[];
  try {
    const body = await request.json();
    compressedHistory = body.compressedHistory ?? [];
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(compressedHistory) || compressedHistory.length === 0) {
    return NextResponse.json(
      { error: "compressedHistory is required" },
      { status: 400 }
    );
  }

  const transcript = compressedHistory
    .map((m) => `${m.role === "user" ? "Founder" : AGENT.name}: ${m.content}`)
    .join("\n\n");

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      system: `Extract structured answers from this product discovery conversation. Output only valid JSON matching this exact schema: { "problemStatement": "string", "vision": "string", "targetUsers": "string", "userNeeds": "string", "solutionOverview": "string", "businessModel": "string", "successMetrics": "string" }. Each field should be 2-3 sentences summarizing what was established in the conversation for that section. Output only the JSON object with no additional text or markdown.`,
      messages: [{ role: "user", content: transcript }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "{}";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const answers = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);

    return NextResponse.json({ answers });
  } catch (err) {
    console.error("[/api/extract]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
