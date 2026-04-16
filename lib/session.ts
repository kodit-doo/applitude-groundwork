import { SessionState } from "@/types/interview";
import { AgentKey } from "@/lib/agent.config";

const SESSION_KEY = "aicofounder_session";
const AGENT_KEY = "aicofounder_agent";
const EARLY_EMAIL_KEY = "aicofounder_early_email";

export function saveSession(state: SessionState): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(state));
    if (state.agentKey) {
      localStorage.setItem(AGENT_KEY, state.agentKey);
    }
  } catch {
    // localStorage may be unavailable — ignore
  }
}

export function loadSession(): SessionState | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionState;
    // Ignore completed sessions — nothing to resume
    if (parsed.isComplete) return null;
    if (!parsed.compressedHistory?.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function loadSavedAgent(): AgentKey | null {
  try {
    const key = localStorage.getItem(AGENT_KEY) as AgentKey | null;
    return key;
  } catch {
    return null;
  }
}

export function saveEarlyEmail(email: string): void {
  try {
    localStorage.setItem(EARLY_EMAIL_KEY, email);
  } catch {
    // ignore
  }
}

export function loadEarlyEmail(): string | null {
  try {
    return localStorage.getItem(EARLY_EMAIL_KEY);
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(AGENT_KEY);
    localStorage.removeItem(EARLY_EMAIL_KEY);
  } catch {
    // ignore
  }
}
