"use client";

import { useState } from "react";
import { AGENTS, AgentKey } from "@/lib/agent.config";
import LeftPanel from "./LeftPanel";

interface AgentSelectProps {
  onSelect: (agentKey: AgentKey) => void;
}

function CheckIcon() {
  return (
    <svg
      width="10"
      height="8"
      viewBox="0 0 10 8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1 4L3.5 6.5L9 1"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AgentSelect({ onSelect }: AgentSelectProps) {
  const [selected, setSelected] = useState<AgentKey | null>(null);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* ── Left panel ── */}
      <LeftPanel />

      {/* ── Right panel ── */}
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
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-[#1E2429] mb-2">
                Choose your AI guide
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed">
                Your guide will help you validate your idea and build your
                product vision.
              </p>
            </div>

            {/* Agent cards */}
            <div className="flex flex-col gap-3 mb-6">
              {(
                Object.entries(AGENTS) as [
                  AgentKey,
                  (typeof AGENTS)[AgentKey],
                ][]
              ).map(([key, agent]) => {
                const isSelected = selected === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelected(key)}
                    className={`flex items-start gap-4 p-4 rounded-lg text-left w-full transition-all ${
                      isSelected
                        ? "border border-[#1E2429]"
                        : "border border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {/* Avatar */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="font-bold text-[#1E2429] text-base leading-tight">
                        {agent.name}
                      </div>
                      <div className="text-[13px] text-gray-400 mb-1.5">
                        {agent.title}
                      </div>
                      <div className="text-[14px] text-gray-600 leading-snug">
                        {agent.description}
                      </div>
                    </div>

                    {/* Checkbox */}
                    <div className="flex-shrink-0 mt-0.5">
                      {isSelected ? (
                        <div className="w-4 h-4 rounded bg-[#1E2429] flex items-center justify-center">
                          <CheckIcon />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded border border-gray-300" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Continue button */}
            <button
              disabled={!selected}
              onClick={() => selected && onSelect(selected)}
              className="w-full py-3 bg-[#DBF227] text-[#1E2429] font-bold rounded-xl hover:bg-[#cde020] transition disabled:opacity-40 disabled:cursor-not-allowed text-base"
            >
              Continue →
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">
              You can switch guides later if needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
