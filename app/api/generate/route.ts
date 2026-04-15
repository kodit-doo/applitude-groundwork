import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT_GENERATE } from "@/lib/prompts";
import { InterviewAnswers } from "@/types/interview";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { answers }: { answers: InterviewAnswers } = await request.json();

    const userContent = `Here are all interview answers:\n\n${Object.entries(answers)
      .map(([k, v]) => `Q${k}: ${v}`)
      .join("\n")}`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT_GENERATE,
      messages: [{ role: "user", content: userContent }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "{}";

    // Extract JSON from response (model may wrap it in markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const document = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);

    return NextResponse.json({ document });
  } catch (err) {
    console.error("[/api/generate]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
