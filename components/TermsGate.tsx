"use client";

interface TermsGateProps {
  onAccept: () => void;
}

export default function TermsGate({ onAccept }: TermsGateProps) {
  return (
    <div className="flex flex-col items-center gap-6 max-w-lg w-full text-center">
      <div className="w-full rounded-2xl border border-gray-200 bg-white p-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
          Before we start
        </p>
        <h2 className="text-xl font-bold text-[#1E2429] mb-4">
          A few quick things
        </h2>
        <ul className="text-sm text-gray-600 text-left space-y-3 mb-6">
          <li className="flex gap-2">
            <span className="text-[#1E2429] font-bold mt-0.5">·</span>
            <span>
              Your answers are used solely to generate your Product Vision
              Document.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#1E2429] font-bold mt-0.5">·</span>
            <span>
              No account is required. Your progress is saved locally in your
              browser.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#1E2429] font-bold mt-0.5">·</span>
            <span>
              When you provide your email to receive the PDF, it may be used by
              Applitude to follow up about their services.
            </span>
          </li>
        </ul>
        <button
          onClick={onAccept}
          className="w-full px-8 py-3 bg-[#DBF227] text-[#1E2429] font-bold rounded-xl hover:bg-[#cde020] transition"
        >
          Accept and continue →
        </button>
      </div>
    </div>
  );
}
