"use client";

import { useEffect, useState } from "react";
import { sections } from "@/lib/questions";
import { InterviewAnswers, VisionDocument } from "@/types/interview";
import SectionProgress from "./SectionProgress";
import QuestionCard from "./QuestionCard";
import DocumentPreview from "./DocumentPreview";
import EmailCapture from "./EmailCapture";

// prettier-ignore
const DEV_ANSWERS: Record<string, string> = {
  "1.1": "Small logistics companies in the Balkans spend 3-4 hours every day manually reconciling orders across WhatsApp, email, and spreadsheets. They constantly miss shipments and overbook drivers because nothing talks to each other.",
  "1.2": "Operations managers at regional courier companies with 10 to 50 drivers. They're usually one person managing everything — dispatch, tracking, client calls — with no real software, just Excel and a phone.",
  "1.3": "Mostly WhatsApp groups for dispatch, a shared Google Sheet for tracking, and phone calls for exceptions. Some use basic TMS software from the 90s that costs a lot and nobody actually uses properly.",
  "1.4": "E-commerce in the Balkans grew 40% last year and these companies are drowning in volume they weren't built for. The ones that don't get organised in the next 12 months will lose contracts to bigger players.",
  "2.1": "Every mid-size courier and logistics company in Southeast Europe runs their entire operation from one screen. Drivers get jobs on a mobile app, dispatchers see everything in real time, and clients get automatic tracking updates without anyone picking up the phone.",
  "2.2": "Making dispatch and tracking so simple that a non-technical operations manager can set it up and run it without any training or IT support. It has to just work on day one.",
  "2.3": "We will never try to be a full ERP or accounting system. No invoicing, no HR, no fleet maintenance. Just dispatch, tracking, and client communication.",
  "3.1": "An operations manager at a 20-person courier company. Probably 35-45 years old, not technical, works from a small office or sometimes from their car. Their day is constant firefighting — phones ringing, drivers calling in with problems, clients asking where their package is.",
  "3.2": "The owner of the company is the buyer. They care about cost reduction and not getting complaints from clients. The ops manager is the user but the owner has to approve the purchase.",
  "3.3": "I spoke with 6 operations managers across Serbia and Bosnia. The sharpest thing I heard: 'I lose one hour every morning just figuring out which drivers are available. By the time I know, three clients have already called asking where their delivery is.'",
  "4.1": "Assign the right driver to the right job at the right time, without calling anyone or checking three different places for information.",
  "4.2": "Information is everywhere and nowhere at the same time. They know a driver is somewhere but not exactly where. They know a package was picked up but not if it was delivered. Everything requires a phone call to confirm.",
  "4.3": "The moment a driver calls in sick and the ops manager can reassign all their jobs to available drivers in two minutes without calling anyone — that's when they'll never go back.",
  "4.4": "They finish their shift without having received a single complaint call from a client. If clients aren't calling to ask where their package is, the system is working.",
  "5.1": "A dispatch and tracking platform built specifically for small logistics companies in the Balkans. Ops managers assign jobs from a web dashboard, drivers accept and update jobs from a mobile app, and clients get automatic SMS updates at every stage.",
  "5.2": "First, a job board where the ops manager creates deliveries and assigns them to drivers. Second, a driver mobile app where drivers accept jobs and mark them delivered. Third, automatic SMS notifications to the client at pickup and delivery.",
  "5.3": "Route optimisation, proof of delivery photos, invoicing, client portal, multi-depot support, and any analytics or reporting. V1 is just: create job, assign driver, track status, notify client.",
  "5.4": "The first time an ops manager sees all their active deliveries on one screen and realises they haven't touched their phone in 20 minutes.",
  "6.1": "The logistics company pays — specifically the owner. The ops manager uses it but has no budget authority.",
  "6.2": "Monthly subscription per company, not per seat. These companies don't think in per-user pricing — they just want to know what it costs per month.",
  "6.3": "€99 per month for up to 10 drivers, €199 per month for up to 30 drivers, €349 for unlimited. That's less than what they lose in one mismanaged week.",
  "6.4": "Direct outreach to logistics associations and freight forwarding networks in Serbia, Bosnia, and Croatia. Then word of mouth — these industries are small and everyone knows everyone.",
  "7.1": "Number of companies that are still active after 30 days. If they try it and keep using it after a month, the product is working.",
  "7.2": "20 paying companies, average revenue per company €150/month, churn below 5% monthly. That's €3,000 MRR which proves the model works before we invest in growth.",
  "7.3": "When companies start referring us to other companies without us asking. And when an ops manager tells me they'd quit their job if their boss cancelled the subscription.",
};

type FlowStage =
  | "interview"
  | "validating"
  | "validation-result"
  | "generating"
  | "preview"
  | "email-capture"
  | "success";

interface ValidationResult {
  status: "ALIGNED" | "MISMATCH";
  message: string;
}

const TOTAL_QUESTIONS = sections.reduce((acc, s) => acc + s.questions.length, 0);

export default function InterviewFlow() {
  const [stage, setStage] = useState<FlowStage>("interview");
  const [sectionIndex, setSectionIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<InterviewAnswers>({});
  const [currentInput, setCurrentInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [generatedDocument, setGeneratedDocument] =
    useState<VisionDocument | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has("__dev")) return;
    setAnswers(DEV_ANSWERS);
    setSectionIndex(6);
    setQuestionIndex(2);
    setCurrentInput(DEV_ANSWERS["7.3"]);
  }, []);

  const currentSection = sections[sectionIndex];
  const currentQuestion = currentSection.questions[questionIndex];
  const isLastQuestion =
    questionIndex === currentSection.questions.length - 1;
  const isLastSection = sectionIndex === sections.length - 1;

  const questionNumber =
    sections.slice(0, sectionIndex).reduce((acc, s) => acc + s.questions.length, 0) +
    questionIndex +
    1;

  const handleNext = async () => {
    const updatedAnswers = {
      ...answers,
      [currentQuestion.id]: currentInput,
    };
    setAnswers(updatedAnswers);
    setCurrentInput("");

    if (!isLastQuestion) {
      setQuestionIndex((q) => q + 1);
      return;
    }

    // End of section — call interview API for acknowledgment (fire and forget)
    setIsLoading(true);
    const sectionAnswers = Object.fromEntries(
      currentSection.questions.map((q) => [q.id, updatedAnswers[q.id] ?? ""])
    );

    try {
      await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId: currentSection.id,
          answers: sectionAnswers,
          message: currentInput,
        }),
      });
    } catch {
      // non-critical — continue regardless
    }

    // After Section 2 (index 1) — run validation
    if (sectionIndex === 1) {
      setStage("validating");
      try {
        const problemAnswers = Object.fromEntries(
          sections[0].questions.map((q) => [
            q.id,
            updatedAnswers[q.id] ?? "",
          ])
        );
        const visionAnswers = Object.fromEntries(
          sections[1].questions.map((q) => [
            q.id,
            updatedAnswers[q.id] ?? "",
          ])
        );

        const res = await fetch("/api/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ problemAnswers, visionAnswers }),
        });
        const data = await res.json();
        setValidationResult(data);
        setStage("validation-result");
      } catch {
        // Skip validation on error and continue
        advanceToNextSection();
      }
      setIsLoading(false);
      return;
    }

    // After last section — generate document
    if (isLastSection) {
      setIsLoading(false);
      await generateDocument(updatedAnswers);
      return;
    }

    setIsLoading(false);
    advanceToNextSection();
  };

  const advanceToNextSection = () => {
    setSectionIndex((s) => s + 1);
    setQuestionIndex(0);
    setStage("interview");
  };

  const generateDocument = async (finalAnswers: InterviewAnswers) => {
    setStage("generating");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: finalAnswers }),
      });
      const data = await res.json();
      setGeneratedDocument(data.document);
      setStage("preview");
    } catch {
      // TODO: show error state
      setStage("preview");
    }
  };

  if (stage === "generating") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-8 h-8 border-2 border-[#DBF227] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#1E2429] font-medium">
          Generating your Product Vision Document…
        </p>
      </div>
    );
  }

  if (stage === "validating") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-8 h-8 border-2 border-[#DBF227] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#1E2429] font-medium">
          Checking alignment between your problem and vision…
        </p>
      </div>
    );
  }

  if (stage === "validation-result" && validationResult) {
    return (
      <div className="flex flex-col items-center gap-6 max-w-xl w-full">
        <div
          className={`w-full rounded-2xl p-8 border ${
            validationResult.status === "ALIGNED"
              ? "bg-[#DBF227]/10 border-[#DBF227]/40"
              : "bg-orange-50 border-orange-200"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-gray-400">
            Vision Check
          </p>
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`text-sm font-bold px-2 py-0.5 rounded ${
                validationResult.status === "ALIGNED"
                  ? "bg-[#DBF227] text-[#1E2429]"
                  : "bg-orange-200 text-orange-800"
              }`}
            >
              {validationResult.status}
            </span>
          </div>
          <p className="text-[#1E2429] text-base">{validationResult.message}</p>
        </div>
        <button
          onClick={advanceToNextSection}
          className="px-8 py-3 bg-[#DBF227] text-[#1E2429] font-bold rounded-xl hover:bg-[#cde020] transition"
        >
          Continue to Section 3 →
        </button>
      </div>
    );
  }

  if (stage === "preview" && generatedDocument) {
    return (
      <div className="w-full max-w-3xl">
        <DocumentPreview
          document={generatedDocument}
          onContinue={() => setStage("email-capture")}
        />
      </div>
    );
  }

  if (stage === "email-capture" && generatedDocument) {
    return (
      <EmailCapture
        answers={answers}
        document={generatedDocument}
        onSuccess={() => setStage("success")}
      />
    );
  }

  if (stage === "success") {
    return (
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
    );
  }

  // Default: interview stage
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
      <div className="w-full">
        <SectionProgress currentSectionIndex={sectionIndex} />
      </div>
      <QuestionCard
        question={currentQuestion}
        sectionTitle={currentSection.title}
        value={currentInput}
        onChange={setCurrentInput}
        onNext={handleNext}
        isLastInSection={isLastQuestion}
        isLoading={isLoading}
        questionNumber={questionNumber}
        totalQuestions={TOTAL_QUESTIONS}
      />
    </div>
  );
}
