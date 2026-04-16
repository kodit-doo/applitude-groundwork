"use client";

import { AGENT } from "@/lib/agent.config";
import AgentAvatar from "./AgentAvatar";

interface OnboardingScreenProps {
  onStart: () => void;
}

export default function OnboardingScreen({ onStart }: OnboardingScreenProps) {
  return (
    <div className="flex flex-col items-center gap-6 max-w-lg w-full text-center animate-fadeIn">
      <AgentAvatar size="lg" />
      <div>
        <h2 className="text-2xl font-bold text-[#1E2429] mb-1">
          Hi, I&apos;m {AGENT.name}.
        </h2>
        <p className="text-sm text-gray-400 font-medium">
          {AGENT.title} by Applitude
        </p>
      </div>

      <div className="w-full rounded-2xl border border-gray-200 bg-white p-8 text-left space-y-4">
        <p className="text-[#1E2429] text-sm leading-relaxed">
          I&apos;ll guide you through a structured product discovery interview —
          the same process Applitude uses in their paid Discovery Sprints.
        </p>
        <p className="text-[#1E2429] text-sm leading-relaxed">
          We&apos;ll cover 7 areas: your problem, vision, target users, user
          needs, solution, business model, and success metrics. At the end
          you&apos;ll receive a professional Product Vision Document.
        </p>
        <div className="pt-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            A few things before we start
          </p>
          <ul className="text-sm text-[#1E2429] space-y-2">
            <li className="flex gap-2">
              <span className="font-bold">·</span>
              <span>Be specific — vague answers produce vague documents</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">·</span>
              <span>
                There are no wrong answers, only incomplete ones
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">·</span>
              <span>
                Your progress is saved — you can take breaks
              </span>
            </li>
          </ul>
        </div>
      </div>

      <button
        onClick={onStart}
        className="w-full px-8 py-4 bg-[#DBF227] text-[#1E2429] font-bold rounded-xl hover:bg-[#cde020] transition text-base"
      >
        Let&apos;s go →
      </button>
    </div>
  );
}
