import Anthropic from "@anthropic-ai/sdk";
import { ConversationMessage } from "@/types/interview";
import { AGENT } from "@/lib/agent.config";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function summarizeSection(
  sectionName: string,
  messages: ConversationMessage[]
): Promise<string> {
  const transcript = messages
    .map((m) => `${m.role === "user" ? "Founder" : AGENT.name}: ${m.content}`)
    .join("\n\n");

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    system: `Summarize the key facts established in this product discovery conversation section (${sectionName}) in 3-5 bullet points. Be specific and factual. Output only the bullet points, no intro text.`,
    messages: [{ role: "user", content: transcript }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return text.trim();
}
