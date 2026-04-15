import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT_VALIDATION } from "@/lib/prompts";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { problemAnswers, visionAnswers } = await request.json();

    const userContent = `PROBLEM STATEMENT ANSWERS:\n${Object.entries(problemAnswers)
      .map(([k, v]) => `Q${k}: ${v}`)
      .join("\n")}\n\nVISION ANSWERS:\n${Object.entries(visionAnswers)
      .map(([k, v]) => `Q${k}: ${v}`)
      .join("\n")}`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 256,
      system: SYSTEM_PROMPT_VALIDATION,
      messages: [{ role: "user", content: userContent }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text.trim() : "";

    const status = text.startsWith("ALIGNED") ? "ALIGNED" : "MISMATCH";
    const message = text.replace(/^(ALIGNED|MISMATCH):\s*/, "");

    return NextResponse.json({ status, message });
  } catch (err) {
    console.error("[/api/validate]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
