import InterviewFlow from "@/components/InterviewFlow";
import Link from "next/link";

export default function DiscoverPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="px-8 py-5 border-b border-gray-100 bg-white">
        <Link
          href="/"
          className="text-[#1E2429] font-extrabold text-xl tracking-tight"
        >
          Applitude
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start px-4 py-12">
        <div className="w-full max-w-2xl mb-10 text-center">
          <h1 className="text-2xl font-bold text-[#1E2429] mb-2">
            Product Discovery Interview
          </h1>
          <p className="text-sm text-gray-400">
            7 sections · 25 questions · ~30 minutes
          </p>
        </div>
        <InterviewFlow />
      </main>
    </div>
  );
}
