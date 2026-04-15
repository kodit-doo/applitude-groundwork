"use client";

import { sections } from "@/lib/questions";

interface SectionProgressProps {
  currentSectionIndex: number;
}

export default function SectionProgress({
  currentSectionIndex,
}: SectionProgressProps) {
  return (
    <div className="w-full flex items-center gap-1">
      {sections.map((section, index) => {
        const isCompleted = index < currentSectionIndex;
        const isActive = index === currentSectionIndex;

        return (
          <div key={section.id} className="flex items-center flex-1 gap-1">
            <div className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`h-1.5 w-full rounded-full transition-colors duration-300 ${
                  isCompleted
                    ? "bg-[#DBF227]"
                    : isActive
                    ? "bg-[#DBF227]/60"
                    : "bg-gray-200"
                }`}
              />
              <span
                className={`text-[10px] font-medium hidden sm:block truncate max-w-full ${
                  isActive
                    ? "text-[#1E2429]"
                    : isCompleted
                    ? "text-gray-500"
                    : "text-gray-300"
                }`}
              >
                {section.title}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
