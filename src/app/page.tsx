"use client";

import { useState } from "react";
import UploadZone from "@/components/UploadZone";
import GraphView from "@/components/GraphView";
import WordCloud from "@/components/WordCloud";
import NodeDetail from "@/components/NodeDetail";
import ProcessingStatus from "@/components/ProcessingStatus";
import { useAnalysis } from "@/hooks/useAnalysis";
import type { Concept } from "@/lib/types";

export default function Home() {
  const { result, status, isProcessing, analyze, reset } = useAnalysis();
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [activeView, setActiveView] = useState<"graph" | "wordcloud">("graph");

  // Upload state
  if (!result && !isProcessing) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">
            Clustr
          </h1>
          <p className="text-gray-400 text-lg max-w-md">
            Drop in your conference notes and discover hidden patterns and
            connections across documents.
          </p>
        </div>
        <UploadZone onAnalyze={analyze} isProcessing={false} />
        {status.stage === "error" && (
          <div className="mt-6 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 max-w-md text-sm">
            {status.message}
          </div>
        )}
      </main>
    );
  }

  // Processing state
  if (isProcessing) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <ProcessingStatus status={status} />
      </main>
    );
  }

  // Results state
  return (
    <main className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-white">Clustr</h1>
          <div className="flex bg-gray-800 rounded-lg p-0.5">
            <button
              onClick={() => {
                setActiveView("graph");
                setSelectedConcept(null);
              }}
              className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                activeView === "graph"
                  ? "bg-purple-600 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Graph View
            </button>
            <button
              onClick={() => {
                setActiveView("wordcloud");
                setSelectedConcept(null);
              }}
              className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                activeView === "wordcloud"
                  ? "bg-purple-600 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Word Cloud
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {result!.concepts.length} concepts &middot;{" "}
            {result!.connections.length} connections &middot;{" "}
            {result!.documentSummaries.length} documents
          </span>
          <button
            onClick={() => {
              reset();
              setSelectedConcept(null);
            }}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all"
          >
            New Analysis
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 relative overflow-hidden">
        {activeView === "graph" ? (
          <GraphView
            data={result!}
            onSelectConcept={setSelectedConcept}
          />
        ) : (
          <WordCloud words={result!.wordFrequencies} />
        )}

        {/* Node detail panel */}
        {selectedConcept && result && (
          <NodeDetail
            concept={selectedConcept}
            data={result}
            onClose={() => setSelectedConcept(null)}
          />
        )}
      </div>
    </main>
  );
}
