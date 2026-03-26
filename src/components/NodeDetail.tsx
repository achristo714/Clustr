"use client";

import type { Concept, AnalysisResult } from "@/lib/types";

const CLUSTER_COLORS = [
  "#a855f7",
  "#06b6d4",
  "#ec4899",
  "#22c55e",
  "#f97316",
  "#3b82f6",
  "#eab308",
  "#ef4444",
];

interface NodeDetailProps {
  concept: Concept;
  data: AnalysisResult;
  onClose: () => void;
}

export default function NodeDetail({
  concept,
  data,
  onClose,
}: NodeDetailProps) {
  const color = CLUSTER_COLORS[concept.cluster % CLUSTER_COLORS.length];

  const relatedConnections = data.connections.filter(
    (c) => c.source === concept.id || c.target === concept.id,
  );

  const relatedConcepts = relatedConnections
    .map((conn) => {
      const otherId =
        conn.source === concept.id ? conn.target : conn.source;
      const other = data.concepts.find((c) => c.id === otherId);
      return other ? { concept: other, strength: conn.strength, reason: conn.reason } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b!.strength - a!.strength);

  const relatedDocs = data.documentSummaries.filter((doc) =>
    doc.keyConcepts.includes(concept.id),
  );

  return (
    <div className="absolute right-0 top-0 h-full w-96 bg-gray-900/95 backdrop-blur-md border-l border-gray-700/50 overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div
              className="w-4 h-4 rounded-full mb-3"
              style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}` }}
            />
            <h2 className="text-xl font-semibold text-white">
              {concept.label}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors p-1"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Description */}
        <p className="text-gray-400 text-sm mb-6">{concept.description}</p>

        {/* Weight */}
        <div className="mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            Importance
          </p>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${concept.weight * 100}%`,
                backgroundColor: color,
              }}
            />
          </div>
        </div>

        {/* Related Concepts */}
        {relatedConcepts.length > 0 && (
          <div className="mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
              Connected Concepts
            </p>
            <div className="space-y-2">
              {relatedConcepts.map((item) => {
                if (!item) return null;
                const relColor =
                  CLUSTER_COLORS[
                    item.concept.cluster % CLUSTER_COLORS.length
                  ];
                return (
                  <div
                    key={item.concept.id}
                    className="bg-white/5 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: relColor }}
                      />
                      <span className="text-sm text-gray-200">
                        {item.concept.label}
                      </span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {Math.round(item.strength * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 pl-4">
                      {item.reason}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Source Documents */}
        {relatedDocs.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
              Source Documents
            </p>
            <div className="space-y-2">
              {relatedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white/5 rounded-lg p-3"
                >
                  <p className="text-sm text-gray-200 mb-1">{doc.name}</p>
                  <p className="text-xs text-gray-500">{doc.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
