"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ConversationMessage, VisionDocument } from "@/types/interview";
import { AGENTS, AgentKey } from "@/lib/agent.config";
import { loadSession, loadSavedAgent, loadEarlyEmail, clearSession } from "@/lib/session";
import AgentSelect from "./AgentSelect";
import InterviewIntro from "./InterviewIntro";
import ChatInterface from "./ChatInterface";
import DocumentPreview from "./DocumentPreview";
import EmailCapture from "./EmailCapture";

// Dev mode pre-loaded compressed history (Marko logistics test data)
const DEV_COMPRESSED_HISTORY: ConversationMessage[] = [
  {
    role: "assistant",
    content:
      "• Problem: Small logistics companies in the Balkans spend 3-4 hours/day reconciling orders across WhatsApp, email, and spreadsheets\n• Target: Operations managers at 10-50 driver courier companies\n• Current tools: WhatsApp, Google Sheets, phone calls, legacy TMS\n• Urgency: 40% e-commerce growth in the Balkans; companies drowning in volume",
  },
  {
    role: "assistant",
    content:
      "• Vision: Every mid-size courier in Southeast Europe runs from one screen\n• Best at: Dispatch and tracking so simple a non-technical ops manager can set it up with no training\n• Out of scope: ERP, accounting, invoicing, HR, fleet maintenance",
  },
  {
    role: "assistant",
    content:
      "• Primary user: Ops manager, 35-45, non-technical, constant firefighting\n• Buyer: Company owner (cost/complaint reduction focus)\n• Research: 6 interviews in Serbia and Bosnia; key insight: 1 hour/morning just figuring out driver availability",
  },
  {
    role: "assistant",
    content:
      "• Primary job: Assign right driver to right job without calling anyone\n• Frustration: Information everywhere and nowhere — driver location, delivery status all require phone calls\n• Switch trigger: Reassign a sick driver's jobs in 2 minutes without any calls\n• Success: Finish shift without a single client complaint call",
  },
  {
    role: "assistant",
    content:
      "• Solution: Dispatch + tracking platform; web dashboard for ops, mobile app for drivers, SMS updates for clients\n• MVP features: Job board (create/assign), driver app (accept/update), automatic SMS at pickup and delivery\n• Out of v1: Route optimisation, proof of delivery, invoicing, client portal, analytics\n• Aha moment: All active deliveries on one screen, no phone touched in 20 minutes",
  },
  {
    role: "assistant",
    content:
      "• Who pays: Logistics company owner\n• Pricing model: Monthly subscription per company (not per seat)\n• Price hypothesis: €99/month ≤10 drivers, €199 ≤30 drivers, €349 unlimited\n• Acquisition: Direct outreach to logistics associations in Serbia, Bosnia, Croatia; then word of mouth",
  },
  {
    role: "assistant",
    content:
      "• North star (0-3 months): Companies still active after 30 days\n• 6-month traction: 20 paying companies, avg €150/month, <5% monthly churn = €3k MRR\n• PMF signal: Companies referring others unprompted; ops manager says they'd quit if boss cancelled",
  },
];

type DiscoverStage =
  | "RESUME_BANNER"
  | "AGENT_SELECT"
  | "INTRO"
  | "CHAT"
  | "GENERATING"
  | "PREVIEW"
  | "EMAIL"
  | "SUCCESS";

export default function DiscoverFlow() {
  const searchParams = useSearchParams();
  const isDevMode =
    searchParams.get("__dev") === "1" &&
    process.env.NODE_ENV === "development";

  const [stage, setStage] = useState<DiscoverStage | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentKey>("anna");
  const [resumedHistory, setResumedHistory] = useState<
    ConversationMessage[] | null
  >(null);
  const [resumedSection, setResumedSection] = useState(0);
  const [resumedCompleted, setResumedCompleted] = useState<string[]>([]);
  const [resumedTrollPaused, setResumedTrollPaused] = useState(false);
  const [generatedDocument, setGeneratedDocument] =
    useState<VisionDocument | null>(null);
  const [extractedAnswers, setExtractedAnswers] = useState<
    Record<string, string> | null
  >(null);
  const [earlyEmail, setEarlyEmail] = useState<string>("");

  useEffect(() => {
    if (isDevMode) {
      setSelectedAgent("anna");
      setStage("CHAT");
      return;
    }
    const session = loadSession();
    if (session) {
      setResumedHistory(session.compressedHistory);
      setResumedSection(session.currentSection);
      setResumedCompleted(session.completedSections);
      // Restore previously selected agent
      const savedAgent = session.agentKey ?? loadSavedAgent() ?? "anna";
      setSelectedAgent(savedAgent);
      // Restore early email if present
      const savedEmail = loadEarlyEmail();
      if (savedEmail) setEarlyEmail(savedEmail);
      // Restore troll pause state
      if (session.isTrollPaused) setResumedTrollPaused(true);
      setStage("RESUME_BANNER");
    } else {
      setStage("AGENT_SELECT");
    }
  }, [isDevMode]);

  const handleInterviewComplete = async (
    compressedHistory: ConversationMessage[]
  ) => {
    setStage("GENERATING");
    try {
      // Extract structured answers from conversation
      const extractRes = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ compressedHistory }),
      });
      const extractData = await extractRes.json();
      const answers = extractData.answers ?? {};
      setExtractedAnswers(answers);

      // Generate vision document
      const genRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const genData = await genRes.json();
      setGeneratedDocument(genData.document);
      clearSession();
      setStage("PREVIEW");
    } catch {
      setStage("PREVIEW");
    }
  };

  // Not yet initialised
  if (!stage) return null;

  // AGENT_SELECT owns its own full-screen layout — render without any wrapper
  if (stage === "AGENT_SELECT") {
    return (
      <AgentSelect
        onSelect={(key) => {
          setSelectedAgent(key);
          setStage("INTRO");
        }}
      />
    );
  }

  // INTRO owns its own full-screen layout — render without any wrapper
  if (stage === "INTRO") {
    const agent = AGENTS[selectedAgent];
    return (
      <InterviewIntro
        agent={agent}
        onStart={(email) => {
          if (email) setEarlyEmail(email);
          setStage("CHAT");
        }}
      />
    );
  }

  // CHAT owns its own full-screen layout — render without outer padding
  if (stage === "CHAT") {
    const agent = AGENTS[selectedAgent];
    const chatProps = isDevMode
      ? {
          initialHistory: DEV_COMPRESSED_HISTORY,
          initialCompletedSections: [
            "problem_statement",
            "vision",
            "target_users",
            "user_needs",
            "solution_overview",
            "business_model",
            "success_metrics",
          ],
          initialSection: 7,
          startComplete: true,
        }
      : {
          initialHistory: resumedHistory ?? [],
          initialCompletedSections: resumedCompleted,
          initialSection: resumedSection,
          startComplete: false,
          initialTrollPaused: resumedTrollPaused,
        };

    return (
      <ChatInterface
        agent={agent}
        agentKey={selectedAgent}
        {...chatProps}
        onInterviewComplete={handleInterviewComplete}
      />
    );
  }

  // All other stages: centered in full viewport
  if (stage === "RESUME_BANNER") {
    return (
      <div className="h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="flex flex-col items-center gap-6 max-w-md w-full text-center">
          <div className="w-full rounded-2xl border border-gray-200 bg-white p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Welcome back
            </p>
            <h2 className="text-xl font-bold text-[#1E2429] mb-2">
              You have an interview in progress.
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Pick up where you left off, or start fresh with a new interview.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setStage("CHAT")}
                className="w-full px-8 py-3 bg-[#DBF227] text-[#1E2429] font-bold rounded-xl hover:bg-[#cde020] transition"
              >
                Continue →
              </button>
              <button
                onClick={() => {
                  clearSession();
                  setResumedHistory(null);
                  setResumedSection(0);
                  setResumedCompleted([]);
                  setResumedTrollPaused(false);
                  setEarlyEmail("");
                  setStage("AGENT_SELECT");
                }}
                className="w-full px-8 py-3 border border-gray-200 text-gray-500 font-medium rounded-xl hover:border-gray-300 transition text-sm"
              >
                Start fresh
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "GENERATING") {
    return (
      <div className="h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-[#DBF227] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#1E2429] font-medium">
          Generating your Product Vision Document…
        </p>
      </div>
    );
  }

  if (stage === "PREVIEW" && generatedDocument) {
    return (
      <div className="h-screen bg-gray-50 overflow-y-auto">
        <div className="flex flex-col items-center px-4 py-10">
          <div className="w-full max-w-3xl">
            <DocumentPreview
              document={generatedDocument}
              onContinue={() => setStage("EMAIL")}
            />
          </div>
        </div>
      </div>
    );
  }

  if (stage === "EMAIL" && generatedDocument) {
    return (
      <div className="h-screen bg-gray-50 overflow-y-auto">
        <div className="flex flex-col items-center justify-center px-4 py-10 min-h-full">
          <EmailCapture
            answers={extractedAnswers ?? {}}
            document={generatedDocument}
            onSuccess={() => setStage("SUCCESS")}
            initialEmail={earlyEmail}
          />
        </div>
      </div>
    );
  }

  if (stage === "SUCCESS") {
    return (
      <div className="h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="flex flex-col items-center gap-6 max-w-xl w-full text-center">
          <div className="w-16 h-16 bg-[#DBF227] rounded-full flex items-center justify-center text-2xl">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-[#1E2429]">
            Check your inbox.
          </h2>
          <p className="text-gray-500">
            Your Product Vision Document has been sent. If you want to go deeper
            on strategy, product scoping, or team setup —{" "}
            <a
              href="https://applitude.tech"
              className="text-[#1E2429] font-semibold underline"
            >
              Applitude
            </a>{" "}
            can help.
          </p>
        </div>
      </div>
    );
  }

  // Fallback — shouldn't reach here
  return null;
}
