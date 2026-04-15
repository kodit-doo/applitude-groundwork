"use client";

import { useState } from "react";
import { InterviewAnswers, VisionDocument } from "@/types/interview";

interface EmailCaptureProps {
  answers: InterviewAnswers;
  document: VisionDocument;
  onSuccess: () => void;
}

export default function EmailCapture({
  answers,
  document,
  onSuccess,
}: EmailCaptureProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, answers, document }),
      });

      if (!res.ok) {
        throw new Error("Submission failed");
      }

      onSuccess();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-md">
      <h2 className="text-xl font-bold text-[#1E2429] mb-2">
        Get your full PDF
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        We will send your Product Vision Document to your inbox. No account
        required.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-[#1E2429] placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#DBF227] focus:border-transparent text-sm transition"
        />
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button
          type="submit"
          disabled={isLoading || !email}
          className="px-6 py-3 bg-[#DBF227] text-[#1E2429] font-bold rounded-xl hover:bg-[#cde020] transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? "Sending…" : "Send me the PDF →"}
        </button>
      </form>
      <p className="text-xs text-gray-300 mt-4 text-center">
        No spam. Unsubscribe anytime.
      </p>
    </div>
  );
}
