import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT_INTERVIEW } from "@/lib/prompts";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { sectionId, answers, message } = await request.json();

    const userContent = [
      answers && Object.keys(answers).length > 0
        ? `Context — answers so far in section ${sectionId}:\n${Object.entries(answers)
            .map(([k, v]) => `Q${k}: ${v}`)
            .join("\n")}\n\n`
        : "",
      `Founder: ${message}`,
    ]
      .filter(Boolean)
      .join("");

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system: SYSTEM_PROMPT_INTERVIEW,
      messages: [{ role: "user", content: userContent }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ text });
  } catch (err) {
    console.error("[/api/interview]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
