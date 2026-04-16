"use client";

import { useState } from "react";
import { AGENT, AgentConfig } from "@/lib/agent.config";

type AvatarSize = "sm" | "md" | "lg";

const SIZE_PX: Record<AvatarSize, number> = {
  sm: 24,
  md: 32,
  lg: 48,
};

const FONT_SIZE: Record<AvatarSize, string> = {
  sm: "text-[10px]",
  md: "text-xs",
  lg: "text-base",
};

interface AgentAvatarProps {
  size?: AvatarSize;
  /** Pass a specific agent config; defaults to AGENT (Anna) if omitted */
  agent?: AgentConfig;
}

export default function AgentAvatar({ size = "md", agent }: AgentAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const cfg = agent ?? AGENT;
  const px = SIZE_PX[size];

  if (!imgError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={cfg.avatar}
        alt={cfg.name}
        width={px}
        height={px}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: px, height: px }}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 font-bold ${FONT_SIZE[size]}`}
      style={{
        width: px,
        height: px,
        backgroundColor: cfg.accentColor,
        color: "#1E2429",
      }}
    >
      {cfg.initials}
    </div>
  );
}
