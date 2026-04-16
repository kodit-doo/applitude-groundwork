"use client";

import { useState } from "react";
import { AgentConfig } from "@/lib/agent.config";
import AgentAvatar from "./AgentAvatar";
import LeftPanel from "./LeftPanel";
import { saveEarlyEmail } from "@/lib/session";

const COVER_ITEMS = [
  "Problem Statement",
  "Vision",
  "Target Users",
  "User Needs",
  "Solution Overview",
  "Business Model",
  "Success Metrics",
];

interface InterviewIntroProps {
  agent: AgentConfig;
  onStart: (email?: string) => void;
}

export default function InterviewIntro({ agent, onStart }: InterviewIntroProps) {
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);

  const handleStartWithEmail = () => {
    if (!email || !agreed) return;
    saveEarlyEmail(email);
    onStart(email);
  };

  const handleStartWithoutEmail = () => {
    if (!agreed) return;
    onStart(undefined);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <LeftPanel />

      {/* Right panel */}
      <div className="flex-1 flex flex-col bg-white h-full overflow-y-auto">
        {/* Wordmark */}
        <div className="px-8 pt-8 pb-0">
          <span className="text-xs font-semibold tracking-[0.2em] text-gray-400 uppercase select-none">
            Y&nbsp;&nbsp;&nbsp;Groundwork
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center px-8 py-10">
          <div className="max-w-sm w-full mx-auto">
            {/* Heading */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#1E2429] mb-1">
                Let&apos;s get started
              </h2>
              <p className="text-sm text-gray-400">
                {agent.name} will guide you through 7 short sections.
              </p>
            </div>

            {/* Agent card */}
            <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50 mb-6">
              <AgentAvatar size="md" agent={agent} />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[#1E2429] text-sm leading-tight">
                  {agent.name}
                </div>
                <div className="text-xs text-gray-400 mb-2">{agent.title}</div>
                {/* Animated typing dots */}
                <span className="flex gap-1 items-center h-3">
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce"
                      style={{ animationDelay: `${dot * 0.15}s` }}
                    />
                  ))}
                </span>
              </div>
            </div>

            {/* What we'll cover */}
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                What we&apos;ll cover
              </p>
              <ul className="flex flex-col gap-1.5">
                {COVER_ITEMS.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#DBF227] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Email input */}
            <div className="mb-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com (optional — get PDF by email)"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-[#1E2429] placeholder:text-gray-300 focus:outline-none focus:border-[#DBF227] transition"
              />
            </div>

            {/* Terms checkbox */}
            <label className="flex items-start gap-2.5 cursor-pointer mb-5">
              <div className="relative mt-0.5 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${
                    agreed
                      ? "bg-[#1E2429] border-[#1E2429]"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {agreed && (
                    <svg
                      width="10"
                      height="8"
                      viewBox="0 0 10 8"
                      fill="none"
                    >
                      <path
                        d="M1 4L3.5 6.5L9 1"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-xs text-gray-500 leading-relaxed">
                I agree to the{" "}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-gray-600 hover:text-[#1E2429]"
                  onClick={(e) => e.stopPropagation()}
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-gray-600 hover:text-[#1E2429]"
                  onClick={(e) => e.stopPropagation()}
                >
                  Privacy Policy
                </a>
              </span>
            </label>

            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              <button
                disabled={!email || !agreed}
                onClick={handleStartWithEmail}
                className="w-full py-3 bg-[#1E2429] text-white font-bold rounded-xl hover:bg-[#2d3740] transition disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              >
                Start interview →
              </button>
              <button
                disabled={!agreed}
                onClick={handleStartWithoutEmail}
                className="w-full py-3 border border-gray-200 text-gray-500 font-medium rounded-xl hover:border-gray-300 transition disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              >
                Start without email
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
