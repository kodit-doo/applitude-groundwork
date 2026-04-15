"use client";

import { useState } from "react";
import { Question } from "@/types/interview";

interface QuestionCardProps {
  question: Question;
  sectionTitle: string;
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  isLastInSection: boolean;
  isLoading?: boolean;
  questionNumber?: number;
  totalQuestions?: number;
}

const MAX_CHARS = 1000;

export default function QuestionCard({
  question,
  sectionTitle,
  value,
  onChange,
  onNext,
  isLastInSection,
  isLoading = false,
  questionNumber,
  totalQuestions,
}: QuestionCardProps) {
  const [touched, setTouched] = useState(false);
  const remaining = MAX_CHARS - value.length;
  const isEmpty = value.trim().length === 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
        {sectionTitle}
        {questionNumber != null && totalQuestions != null
          ? ` · Question ${questionNumber} of ${totalQuestions}`
          : ` · Q${question.id}`}
      </p>
      <h2 className="text-xl font-semibold text-[#1E2429] leading-snug mb-6">
        {question.text}
      </h2>
      <textarea
        className="w-full min-h-[140px] resize-y rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[#1E2429] placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#DBF227] focus:border-transparent transition text-sm"
        placeholder={question.placeholder}
        value={value}
        maxLength={MAX_CHARS}
        onChange={(e) => {
          onChange(e.target.value);
          if (!touched) setTouched(true);
        }}
      />
      <div className="flex items-center justify-between mt-3">
        <span
          className={`text-xs ${
            remaining < 100 ? "text-orange-400" : "text-gray-300"
          }`}
        >
          {remaining} characters remaining
        </span>
        <button
          onClick={onNext}
          disabled={isEmpty || isLoading}
          className="px-6 py-2.5 bg-[#DBF227] text-[#1E2429] font-bold rounded-xl text-sm hover:bg-[#cde020] transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading
            ? "..."
            : isLastInSection
            ? "Complete section →"
            : "Next →"}
        </button>
      </div>
    </div>
  );
}
