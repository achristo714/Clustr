"use client";

import type { ProcessingStatus as Status } from "@/lib/types";

interface ProcessingStatusProps {
  status: Status;
}

export default function ProcessingStatus({ status }: ProcessingStatusProps) {
  const stages = [
    { key: "extracting", label: "Extracting text" },
    { key: "analyzing", label: "AI analysis" },
    { key: "building", label: "Building graph" },
  ];

  return (
    <div className="w-full max-w-md mx-auto text-center">
      <div className="mb-8">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-gray-700" />
          <div
            className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"
            style={{ animationDuration: "1.5s" }}
          />
          <div className="absolute inset-2 rounded-full bg-purple-500/10 flex items-center justify-center">
            <span className="text-purple-400 font-mono text-sm">
              {status.progress}%
            </span>
          </div>
        </div>
        <p className="text-lg text-gray-200 mb-2">{status.message}</p>
      </div>

      <div className="flex items-center justify-center gap-2">
        {stages.map((stage, i) => {
          const stageIndex = stages.findIndex((s) => s.key === status.stage);
          const isActive = stage.key === status.stage;
          const isComplete = i < stageIndex || status.stage === "complete";

          return (
            <div key={stage.key} className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                  isComplete
                    ? "bg-green-400"
                    : isActive
                      ? "bg-purple-400 animate-pulse"
                      : "bg-gray-600"
                }`}
              />
              <span
                className={`text-xs ${
                  isComplete
                    ? "text-green-400"
                    : isActive
                      ? "text-purple-300"
                      : "text-gray-600"
                }`}
              >
                {stage.label}
              </span>
              {i < stages.length - 1 && (
                <div
                  className={`w-8 h-px ${isComplete ? "bg-green-400/50" : "bg-gray-700"}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
