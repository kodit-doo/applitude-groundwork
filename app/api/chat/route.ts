import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkCors } from "@/lib/cors";
import { buildSystemPrompt } from "@/lib/prompts";
import { AGENTS, AgentKey } from "@/lib/agent.config";
import { ConversationMessage } from "@/types/interview";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MARKER_SECTION = /\[SECTION_COMPLETE:\s*(\w+)\]/;
const MARKER_INTERVIEW = /\[INTERVIEW_COMPLETE\]/;
const MARKER_TROLL_PAUSE = /\[TROLL_PAUSE\]/;

export async function POST(request: NextRequest) {
  const corsError = checkCors(request);
  if (corsError) return corsError;

  let messages: ConversationMessage[];
  let agentKey: AgentKey;
  try {
    const body = await request.json();
    messages = body.messages ?? [];
    agentKey = (body.agentKey as AgentKey) ?? "anna";
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
    });
  }

  // Input validation — max 1000 chars on last user message
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (lastUser && lastUser.content.length > 1000) {
    return new Response(JSON.stringify({ error: "Message too long" }), {
      status: 400,
    });
  }

  const agent = AGENTS[agentKey] ?? AGENTS.anna;
  const systemPrompt = buildSystemPrompt(agent);

  const encoder = new TextEncoder();

  function sseEvent(data: object): Uint8Array {
    return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const messageStream = client.messages.stream({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 400,
          system: systemPrompt,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        });

        let buffer = "";

        for await (const event of messageStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            buffer += event.delta.text;

            // Check for complete section marker
            const sectionMatch = MARKER_SECTION.exec(buffer);
            const interviewMatch = MARKER_INTERVIEW.exec(buffer);
            const trollPauseMatch = MARKER_TROLL_PAUSE.exec(buffer);

            if (sectionMatch) {
              const idx = sectionMatch.index;
              const before = buffer.slice(0, idx);
              const after = buffer.slice(idx + sectionMatch[0].length);

              if (before) {
                controller.enqueue(sseEvent({ type: "token", text: before }));
              }
              controller.enqueue(
                sseEvent({
                  type: "section_complete",
                  section: sectionMatch[1].trim(),
                })
              );
              buffer = after;
            } else if (interviewMatch) {
              const idx = interviewMatch.index;
              const before = buffer.slice(0, idx);
              const after = buffer.slice(idx + interviewMatch[0].length);

              if (before) {
                controller.enqueue(sseEvent({ type: "token", text: before }));
              }
              controller.enqueue(sseEvent({ type: "interview_complete" }));
              buffer = after;
            } else if (trollPauseMatch) {
              const idx = trollPauseMatch.index;
              const before = buffer.slice(0, idx);
              const after = buffer.slice(idx + trollPauseMatch[0].length);

              if (before) {
                controller.enqueue(sseEvent({ type: "token", text: before }));
              }
              controller.enqueue(sseEvent({ type: "troll_pause" }));
              buffer = after;
            } else {
              // Flush safe prefix (up to last `[` which might start a marker)
              const bracketIdx = buffer.lastIndexOf("[");
              if (bracketIdx > 0) {
                const safe = buffer.slice(0, bracketIdx);
                controller.enqueue(sseEvent({ type: "token", text: safe }));
                buffer = buffer.slice(bracketIdx);
              } else if (!buffer.includes("[")) {
                controller.enqueue(sseEvent({ type: "token", text: buffer }));
                buffer = "";
              }
              // else: buffer starts with [ — hold until more tokens arrive
            }
          }
        }

        // Flush remaining buffer
        if (buffer) {
          // Final marker check
          const sectionMatch = MARKER_SECTION.exec(buffer);
          const interviewMatch = MARKER_INTERVIEW.exec(buffer);
          const trollPauseMatch = MARKER_TROLL_PAUSE.exec(buffer);

          if (sectionMatch) {
            const before = buffer.slice(0, sectionMatch.index);
            if (before)
              controller.enqueue(sseEvent({ type: "token", text: before }));
            controller.enqueue(
              sseEvent({
                type: "section_complete",
                section: sectionMatch[1].trim(),
              })
            );
          } else if (interviewMatch) {
            const before = buffer.slice(0, interviewMatch.index);
            if (before)
              controller.enqueue(sseEvent({ type: "token", text: before }));
            controller.enqueue(sseEvent({ type: "interview_complete" }));
          } else if (trollPauseMatch) {
            const before = buffer.slice(0, trollPauseMatch.index);
            if (before)
              controller.enqueue(sseEvent({ type: "token", text: before }));
            controller.enqueue(sseEvent({ type: "troll_pause" }));
            const after = buffer.slice(
              trollPauseMatch.index + trollPauseMatch[0].length
            );
            if (after.trim())
              controller.enqueue(sseEvent({ type: "token", text: after }));
          } else {
            controller.enqueue(sseEvent({ type: "token", text: buffer }));
          }
        }

        controller.enqueue(sseEvent({ type: "done" }));
      } catch (err) {
        console.error("[/api/chat]", err);
        controller.enqueue(
          sseEvent({ type: "token", text: "\n\n[Error — please try again]" })
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
