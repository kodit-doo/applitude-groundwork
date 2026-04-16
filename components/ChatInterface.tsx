"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ConversationMessage, SessionState } from "@/types/interview";
import { AGENTS, AgentKey, AgentConfig } from "@/lib/agent.config";
import { saveSession } from "@/lib/session";
import AgentAvatar from "./AgentAvatar";

const SECTION_NAMES = [
  "problem_statement",
  "vision",
  "target_users",
  "user_needs",
  "solution_overview",
  "business_model",
  "success_metrics",
];

const SECTION_LABELS = [
  "Problem statement",
  "Vision",
  "Target users",
  "User needs",
  "Solution overview",
  "Business model",
  "Success metrics",
];

interface ChatInterfaceProps {
  agent: AgentConfig;
  agentKey: AgentKey;
  initialHistory?: ConversationMessage[];
  initialCompletedSections?: string[];
  initialSection?: number;
  startComplete?: boolean;
  initialTrollPaused?: boolean;
  onInterviewComplete: (compressedHistory: ConversationMessage[]) => void;
}

interface StreamEvent {
  type:
    | "token"
    | "section_complete"
    | "interview_complete"
    | "troll_pause"
    | "done";
  text?: string;
  section?: string;
}

// Returns true if text looks like a genuine answer worth sending to the API
// when troll pause is active.
function looksGenuine(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 20) return false;
  // Reject if text is dominated by a single character (e.g. "aaaaaaaaaaaaaaaaaaaaaa")
  const noSpace = trimmed.replace(/\s/g, "");
  if (noSpace.length === 0) return false;
  const uniqueChars = new Set(noSpace.toLowerCase()).size;
  return uniqueChars > 2;
}

// Simple markdown renderer: bold and newlines only
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
    return (
      <span key={i}>
        {rendered}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
}

// ── Send arrow icon ────────────────────────────────────────────────────────
function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M3 8H13M13 8L9 4M13 8L9 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Animated typing dots ───────────────────────────────────────────────────
function TypingDots({ size = "md" }: { size?: "sm" | "md" }) {
  const dotClass =
    size === "sm"
      ? "w-1 h-1 rounded-full bg-gray-400 animate-bounce"
      : "w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce";
  return (
    <span className="flex gap-1 items-center">
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className={dotClass}
          style={{ animationDelay: `${dot * 0.15}s` }}
        />
      ))}
    </span>
  );
}

export default function ChatInterface({
  agent,
  agentKey,
  initialHistory = [],
  initialCompletedSections = [],
  initialSection = 0,
  startComplete = false,
  initialTrollPaused = false,
  onInterviewComplete,
}: ChatInterfaceProps) {
  // ── State ────────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [compressedHistory, setCompressedHistory] =
    useState<ConversationMessage[]>(initialHistory);
  const [currentSection, setCurrentSection] = useState(initialSection);
  const [completedSections, setCompletedSections] = useState<string[]>(
    initialCompletedSections
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(startComplete);
  const [inputValue, setInputValue] = useState("");
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isTrollPaused, setIsTrollPaused] = useState(initialTrollPaused);
  const [trollBlockVisible, setTrollBlockVisible] = useState(false);
  const currentSectionMessagesRef = useRef<ConversationMessage[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasInitialized = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage, scrollToBottom]);

  // Initialise textarea height on mount so it matches the send button (44px)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
      textareaRef.current.style.overflowY = "hidden";
    }
  }, []);

  // ── Persist session ──────────────────────────────────────────────────────
  const persistSession = useCallback(
    (
      updatedCompressed: ConversationMessage[],
      updatedCompleted: string[],
      section: number,
      complete: boolean,
      trollPaused = false
    ) => {
      const state: SessionState = {
        compressedHistory: updatedCompressed,
        completedSections: updatedCompleted,
        currentSection: section,
        isComplete: complete,
        agentKey,
        isTrollPaused: trollPaused,
      };
      saveSession(state);
    },
    [agentKey]
  );

  // ── Summarize section (unchanged) ───────────────────────────────────────
  const summarizeSection = useCallback(
    async (
      sectionName: string,
      sectionMessages: ConversationMessage[]
    ): Promise<string> => {
      try {
        const res = await fetch("/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sectionName, messages: sectionMessages }),
        });
        if (!res.ok) return "";
        const data = await res.json();
        return data.summary ?? "";
      } catch {
        return "";
      }
    },
    []
  );

  // ── Stream chat ──────────────────────────────────────────────────────────
  const streamChat = useCallback(
    async (historyToSend: ConversationMessage[]) => {
      setIsStreaming(true);
      setStreamingMessage("");

      let accumulated = "";
      let buffer = "";

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: historyToSend, agentKey }),
        });

        if (!res.ok || !res.body) {
          setIsStreaming(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        let sectionCompleted: string | null = null;
        let interviewCompleted = false;
        let trollPauseTriggered = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw) continue;

            try {
              const event: StreamEvent = JSON.parse(raw);
              if (event.type === "token" && event.text) {
                accumulated += event.text;
                setStreamingMessage(accumulated);
              } else if (event.type === "section_complete" && event.section) {
                sectionCompleted = event.section;
              } else if (event.type === "interview_complete") {
                interviewCompleted = true;
              } else if (event.type === "troll_pause") {
                trollPauseTriggered = true;
              }
            } catch {
              // malformed event — skip
            }
          }
        }

        const assistantMessage: ConversationMessage = {
          role: "assistant",
          content: accumulated,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setStreamingMessage("");

        currentSectionMessagesRef.current = [
          ...currentSectionMessagesRef.current,
          assistantMessage,
        ];

        // Update troll pause state: set on trigger, clear on any normal response
        setIsTrollPaused(trollPauseTriggered);

        if (sectionCompleted) {
          const sectionMessages = currentSectionMessagesRef.current;
          currentSectionMessagesRef.current = [];

          const summary = await summarizeSection(
            sectionCompleted,
            sectionMessages
          );

          const summaryMessage: ConversationMessage = {
            role: "assistant",
            content: summary || `[${sectionCompleted} section completed]`,
          };

          setCompressedHistory((prev) => {
            const updated = [...prev, summaryMessage];
            const newSection = currentSection + 1;
            const newCompleted = [...completedSections, sectionCompleted!];
            setCurrentSection(newSection);
            setCompletedSections(newCompleted);
            persistSession(updated, newCompleted, newSection, false, trollPauseTriggered);
            return updated;
          });
        } else {
          setCompressedHistory((prev) => {
            const updated = [...prev, assistantMessage];
            persistSession(updated, completedSections, currentSection, false, trollPauseTriggered);
            return updated;
          });
        }

        if (interviewCompleted) {
          setIsComplete(true);
          setTimeout(() => {
            setCompressedHistory((latest) => {
              onInterviewComplete(latest);
              return latest;
            });
          }, 1500);
        }
      } catch {
        setStreamingMessage("");
      } finally {
        setIsStreaming(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      currentSection,
      completedSections,
      agentKey,
      summarizeSection,
      persistSession,
      onInterviewComplete,
    ]
  );

  // ── Init (unchanged) ────────────────────────────────────────────────────
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (startComplete) {
      setTimeout(() => {
        onInterviewComplete(initialHistory);
      }, 500);
      return;
    }

    if (initialHistory.length > 0) {
      const resumeInit: ConversationMessage[] = [
        ...initialHistory,
        { role: "user", content: "I'm back. Where did we leave off?" },
      ];
      streamChat(resumeInit);
    } else {
      streamChat([{ role: "user", content: "Start the interview." }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isStreaming) return;

    // Troll pause gate: block non-genuine messages, resume on genuine ones
    if (isTrollPaused) {
      if (!looksGenuine(text)) {
        setTrollBlockVisible(true);
        setTimeout(() => setTrollBlockVisible(false), 2000);
        return;
      }
      // Genuine answer — lift the pause before sending
      setIsTrollPaused(false);
    }

    setInputValue("");

    // Reset textarea to single-line height
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
      textareaRef.current.style.overflowY = "hidden";
    }

    const userMessage: ConversationMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    currentSectionMessagesRef.current = [
      ...currentSectionMessagesRef.current,
      userMessage,
    ];

    const historyToSend: ConversationMessage[] = [
      ...compressedHistory,
      userMessage,
    ];

    setCompressedHistory((prev) => [...prev, userMessage]);
    await streamChat(historyToSend);
  }, [inputValue, isStreaming, compressedHistory, streamChat, isTrollPaused]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    // Only show scrollbar when content exceeds max height
    ta.style.overflowY = ta.scrollHeight > 120 ? "auto" : "hidden";
  };

  const charCount = inputValue.length;
  const charOverWarning = charCount > 800;
  const charOverLimit = charCount > 950;

  const activeAgent: AgentConfig = AGENTS[agentKey] ?? agent;
  const currentSectionLabel =
    SECTION_LABELS[Math.min(currentSection, SECTION_LABELS.length - 1)];
  const stepDisplay = Math.min(currentSection + 1, 7);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">

      {/* ══════════════════════════════════════════════════════
          LEFT SIDEBAR — desktop only (md+)
      ══════════════════════════════════════════════════════ */}
      <aside className="hidden md:flex w-[280px] flex-col border-r border-[#e5e7eb] bg-white flex-shrink-0 h-full">

        {/* Wordmark */}
        <div className="px-5 pt-5 pb-4">
          <span className="text-[11px] font-semibold tracking-[0.2em] text-gray-400 uppercase select-none">
            Y&nbsp;&nbsp;&nbsp;Groundwork
          </span>
        </div>

        {/* Progress bar */}
        <div className="px-5">
          <div className="h-2 rounded-sm bg-[#e5e7eb] overflow-hidden">
            <div
              className="h-full bg-[#1E2429] transition-all duration-300 ease-in-out"
              style={{
                width: `${(completedSections.length / 7) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Step counter */}
        <div className="px-5 pt-4 pb-3">
          <p className="text-[22px] font-bold text-[#1E2429] leading-tight">
            Step {stepDisplay} of 7
          </p>
        </div>

        {/* Section list */}
        <nav className="flex-1 overflow-y-auto px-5 pb-2">
          <ul className="flex flex-col gap-0.5">
            {SECTION_NAMES.map((name, i) => {
              const isCompleted = completedSections.includes(name);
              const isActive = i === currentSection && !isComplete;
              return (
                <li key={name} className="flex items-center gap-3 py-1.5">
                  {/* Number badge — square */}
                  <div
                    className={`w-6 h-6 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                      isCompleted || isActive
                        ? "bg-[#1E2429]"
                        : "bg-white border border-[#e5e7eb]"
                    }`}
                  >
                    {isCompleted ? (
                      <span className="text-white text-[10px] leading-none">
                        ✓
                      </span>
                    ) : (
                      <span
                        className={`text-[11px] font-medium leading-none ${
                          isActive ? "text-white font-bold" : "text-gray-400"
                        }`}
                      >
                        {i + 1}
                      </span>
                    )}
                  </div>
                  {/* Label */}
                  <span
                    className={`text-sm leading-tight transition-all duration-300 ${
                      isCompleted
                        ? "text-gray-400 font-normal"
                        : isActive
                        ? "text-[#1E2429] font-medium"
                        : "text-[#9ca3af] font-normal"
                    }`}
                  >
                    {SECTION_LABELS[i]}
                  </span>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom agent strip */}
        <div className="border-t border-[#e5e7eb] px-5 py-5">
          <div className="flex items-center gap-2.5">
            <AgentAvatar size="md" agent={activeAgent} />
            <div>
              <p className="text-xs text-gray-500 leading-tight">
                {activeAgent.name} · AI Guide
              </p>
              <div className="mt-1.5">
                <TypingDots size="sm" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════
          MAIN CHAT AREA
      ══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">

        {/* ── Mobile top bar (hidden md+) ── */}
        <div className="md:hidden border-b border-[#e5e7eb] bg-white px-4 py-3 flex-shrink-0">
          {/* Row 1: wordmark + agent */}
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-semibold tracking-[0.18em] text-gray-400 uppercase select-none">
              Y&nbsp;&nbsp;&nbsp;Groundwork
            </span>
            <div className="flex items-center gap-1.5">
              <AgentAvatar size="sm" agent={activeAgent} />
              <span className="text-[13px] text-gray-600 font-medium">
                {activeAgent.name}
              </span>
            </div>
          </div>
          {/* Row 2: progress pills */}
          <div className="flex gap-1 mb-1.5">
            {SECTION_NAMES.map((name, i) => {
              const isCompleted = completedSections.includes(name);
              const isActive = i === currentSection && !isComplete;
              return (
                <div
                  key={name}
                  className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                    isCompleted || isActive ? "bg-[#1E2429]" : "bg-[#e5e7eb]"
                  }`}
                />
              );
            })}
          </div>
          <p className="text-[12px] text-gray-400 text-center">
            Section {stepDisplay} of 7 · {currentSectionLabel}
          </p>
        </div>

        {/* ── Desktop section name bar (hidden below md) ── */}
        <div className="hidden md:flex items-center border-b border-[#e5e7eb] bg-white px-5 py-3 flex-shrink-0">
          <span className="text-sm text-gray-400">{currentSectionLabel}</span>
        </div>

        {/* ── Messages area ── */}
        <div className="flex-1 overflow-y-auto bg-white px-4 md:px-6 py-6">
          <div className="max-w-[680px] mx-auto space-y-5">

            {messages.map((msg, i) =>
              msg.role === "user" ? (
                /* User bubble — right aligned */
                <div key={i} className="flex justify-end">
                  <div className="max-w-[75%] px-4 py-3 bg-[#1E2429] text-white text-[15px] leading-relaxed rounded-lg">
                    {msg.content}
                  </div>
                </div>
              ) : (
                /* Agent bubble — left aligned */
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="flex items-start gap-3">
                    <AgentAvatar size="md" agent={activeAgent} />
                    <div className="flex-1 min-w-0 px-5 py-4 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg text-[15px] leading-relaxed text-[#1E2429]">
                      {renderMarkdown(msg.content)}
                    </div>
                  </div>
                  {/* Agent label below bubble */}
                  <p className="text-xs text-gray-400 ml-11">
                    {activeAgent.name} · AI Guide
                  </p>
                </div>
              )
            )}

            {/* Streaming / typing indicator */}
            {isStreaming && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-start gap-3">
                  <AgentAvatar size="md" agent={activeAgent} />
                  <div className="flex-1 min-w-0 px-5 py-4 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg text-[15px] leading-relaxed text-[#1E2429]">
                    {streamingMessage ? (
                      renderMarkdown(streamingMessage)
                    ) : (
                      /* Waiting for first token */
                      <span className="flex gap-1 items-center h-5">
                        <TypingDots />
                      </span>
                    )}
                  </div>
                </div>
                {/* Agent label — with animated ··· while text is streaming */}
                <div className="flex items-center gap-1.5 ml-11">
                  <p className="text-xs text-gray-400">
                    {activeAgent.name} · AI Guide
                  </p>
                  {streamingMessage && (
                    <TypingDots size="sm" />
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ── Input area ── */}
        <div
          className="border-t border-[#e5e7eb] bg-white px-4 md:px-6 py-4 flex-shrink-0"
          style={{
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
          }}
        >
          <div className="max-w-[680px] mx-auto">
            {/* Troll pause banner */}
            {isTrollPaused && !isComplete && (
              <div className="mb-3 px-4 py-2 bg-gray-100 rounded-lg text-center">
                <p className="text-xs text-gray-500">
                  {activeAgent.name} is waiting. Send a genuine answer to
                  continue.
                </p>
              </div>
            )}
            <div className="flex gap-2 items-end">
              {/* Textarea */}
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isComplete ? "Interview complete." : "Type your answer..."
                  }
                  disabled={isStreaming || isComplete}
                  rows={1}
                  maxLength={1000}
                  className="w-full resize-none border border-[#e5e7eb] rounded-lg px-4 py-[9px] text-[15px] text-[#1E2429] placeholder-gray-300 focus:outline-none focus:border-[#1E2429] disabled:opacity-50 disabled:cursor-not-allowed overflow-y-hidden leading-relaxed bg-white"
                  style={{ minHeight: 44, maxHeight: 120 }}
                />
                {charOverWarning && (
                  <span
                    className={`absolute bottom-2 right-3 text-[10px] font-medium ${
                      charOverLimit ? "text-red-500" : "text-gray-400"
                    }`}
                  >
                    {charCount}/1000
                  </span>
                )}
              </div>
              {/* Send button — 44×44 square */}
              <button
                onClick={handleSend}
                disabled={isStreaming || !inputValue.trim() || isComplete}
                className="w-11 h-11 flex items-center justify-center rounded-lg flex-shrink-0 transition-colors bg-[#1E2429] disabled:bg-[#e5e7eb] text-white disabled:text-[#9ca3af]"
              >
                <SendIcon />
              </button>
            </div>
            {/* Troll block inline message — fades out after 2 s */}
            {trollBlockVisible ? (
              <p className="text-xs text-gray-400 text-center mt-1.5 animate-pulse">
                {activeAgent.name} is waiting for a real answer. Take your
                time.
              </p>
            ) : (
              <p className="text-[11px] text-gray-300 mt-1.5 text-center">
                {activeAgent.name} is AI and can make mistakes. Always verify
                important information.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
