"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleStart = (e: React.MouseEvent) => {
    if (!e.shiftKey) return;
    if (process.env.NODE_ENV !== "development") return;
    e.preventDefault();
    router.push("/discover?__dev=1");
  };
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="px-8 py-6 flex items-center justify-between max-w-6xl mx-auto w-full">
        <span className="text-[#1E2429] font-extrabold text-xl tracking-tight">
          Applitude
        </span>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center max-w-3xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 bg-[#DBF227]/20 text-[#1E2429] text-xs font-semibold px-3 py-1 rounded-full mb-8 uppercase tracking-widest">
          Free tool
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#1E2429] leading-tight mb-5">
          Turn your idea into a product plan — in 30 minutes.
        </h1>
        <p className="text-gray-500 text-lg mb-10 max-w-xl">
          Answer 25 focused questions. Get a professional Product Vision
          Document, free. No signup required.
        </p>
        <Link
          href="/discover"
          onClick={handleStart}
          className="inline-block px-8 py-4 bg-[#DBF227] text-[#1E2429] font-bold text-base rounded-xl hover:bg-[#cde020] transition"
        >
          Start for free →
        </Link>

        {/* Below fold */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-24 text-left w-full">
          {[
            {
              label: "Problem clarity",
              description:
                "Sharpen exactly who you are building for and what pain you are solving before writing a single line of code.",
            },
            {
              label: "Vision alignment",
              description:
                "AI checks whether your vision directly addresses your stated problem — and flags it if something is off.",
            },
            {
              label: "User journey definition",
              description:
                "Map your primary persona, their core job-to-be-done, and the moment they first feel the value of your product.",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-gray-50 rounded-2xl p-6 border border-gray-100"
            >
              <div className="w-2 h-2 rounded-full bg-[#DBF227] mb-4" />
              <h3 className="font-bold text-[#1E2429] mb-2">{item.label}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-gray-400 border-t border-gray-100">
        A free tool by{" "}
        <a
          href="https://applitude.tech"
          className="text-[#1E2429] font-semibold hover:underline"
        >
          Applitude
        </a>{" "}
        · applitude.tech
      </footer>
    </div>
  );
}
