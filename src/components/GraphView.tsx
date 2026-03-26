"use client";

import { useRef, useEffect, useCallback } from "react";
import cytoscape, { type Core, type EventObject } from "cytoscape";
import type { AnalysisResult, Concept } from "@/lib/types";

const CLUSTER_COLORS = [
  "#a855f7", // purple
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#22c55e", // green
  "#f97316", // orange
  "#3b82f6", // blue
  "#eab308", // yellow
  "#ef4444", // red
];

interface GraphViewProps {
  data: AnalysisResult;
  onSelectConcept: (concept: Concept | null) => void;
}

export default function GraphView({ data, onSelectConcept }: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const onSelectRef = useRef(onSelectConcept);
  onSelectRef.current = onSelectConcept;

  const initGraph = useCallback(() => {
    if (!containerRef.current) return;

    // Destroy previous instance
    if (cyRef.current) {
      cyRef.current.destroy();
      cyRef.current = null;
    }

    const nodeIds = new Set(data.concepts.map((c) => c.id));

    const nodes = data.concepts.map((concept) => ({
      data: {
        id: concept.id,
        label: concept.label,
        weight: concept.weight,
        cluster: concept.cluster,
        color: CLUSTER_COLORS[concept.cluster % CLUSTER_COLORS.length],
        size: 20 + concept.weight * 40,
      },
    }));

    // Filter out edges referencing non-existent nodes
    const edges = data.connections
      .filter((conn) => nodeIds.has(conn.source) && nodeIds.has(conn.target))
      .map((conn, i) => ({
        data: {
          id: `edge-${i}`,
          source: conn.source,
          target: conn.target,
          strength: conn.strength,
          reason: conn.reason,
        },
      }));

    const cy = cytoscape({
      container: containerRef.current,
      elements: { nodes, edges },
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "background-color": "data(color)",
            width: "data(size)",
            height: "data(size)",
            "font-size": "11px",
            color: "#e5e7eb",
            "text-valign": "bottom",
            "text-margin-y": 8,
            "text-outline-color": "#0d1117",
            "text-outline-width": 2,
            "border-width": 2,
            "border-color": "data(color)",
            "border-opacity": 0.3,
            "background-opacity": 0.85,
            "overlay-opacity": 0,
          } as cytoscape.Css.Node,
        },
        {
          selector: "node:active",
          style: {
            "overlay-opacity": 0,
          } as cytoscape.Css.Node,
        },
        {
          selector: "edge",
          style: {
            width: "mapData(strength, 0, 1, 1, 4)",
            "line-color": "#ffffff",
            "line-opacity": 0.15,
            "curve-style": "bezier",
            "overlay-opacity": 0,
          } as cytoscape.Css.Edge,
        },
        {
          selector: "node.highlighted",
          style: {
            "border-width": 4,
            "border-opacity": 1,
            "background-opacity": 1,
            "font-weight": "bold",
            "text-outline-width": 3,
          } as cytoscape.Css.Node,
        },
        {
          selector: "edge.highlighted",
          style: {
            "line-opacity": 0.6,
            width: "mapData(strength, 0, 1, 2, 6)",
          } as cytoscape.Css.Edge,
        },
        {
          selector: "node.faded",
          style: {
            opacity: 0.15,
          } as cytoscape.Css.Node,
        },
        {
          selector: "edge.faded",
          style: {
            opacity: 0.05,
          } as cytoscape.Css.Edge,
        },
      ],
      layout: { name: "preset" },
      minZoom: 0.3,
      maxZoom: 3,
      wheelSensitivity: 0.3,
    });

    // Run layout after graph is ready
    cy.ready(() => {
      const layout = cy.layout({
        name: "cose",
        animate: true,
        animationDuration: 1500,
        nodeRepulsion: 8000,
        idealEdgeLength: 120,
        gravity: 0.3,
        numIter: 500,
        padding: 50,
        randomize: true,
      } as cytoscape.CoseLayoutOptions);
      layout.run();
    });

    // Hover interactions
    cy.on("mouseover", "node", (e: EventObject) => {
      const node = e.target;
      const neighborhood = node.closedNeighborhood();
      cy.elements().addClass("faded");
      neighborhood.removeClass("faded").addClass("highlighted");
      if (containerRef.current) containerRef.current.style.cursor = "pointer";
    });

    cy.on("mouseout", "node", () => {
      cy.elements().removeClass("faded highlighted");
      if (containerRef.current) containerRef.current.style.cursor = "default";
    });

    // Click to select
    cy.on("tap", "node", (e: EventObject) => {
      const nodeId = e.target.id();
      const concept = data.concepts.find((c) => c.id === nodeId) || null;
      onSelectRef.current(concept);
    });

    cy.on("tap", (e: EventObject) => {
      if (e.target === cy) {
        onSelectRef.current(null);
      }
    });

    cyRef.current = cy;
  }, [data]);

  useEffect(() => {
    initGraph();
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [initGraph]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ background: "#0d1117" }}
      />
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 text-xs">
        <p className="text-gray-400 mb-2 font-medium">Clusters</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {Array.from(new Set(data.concepts.map((c) => c.cluster)))
            .sort()
            .slice(0, 8)
            .map((cluster) => (
              <div key={cluster} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      CLUSTER_COLORS[cluster % CLUSTER_COLORS.length],
                  }}
                />
                <span className="text-gray-400">
                  {data.concepts
                    .filter((c) => c.cluster === cluster)
                    .slice(0, 2)
                    .map((c) => c.label)
                    .join(", ")}
                </span>
              </div>
            ))}
        </div>
      </div>
      {/* Controls hint */}
      <div className="absolute top-4 right-4 text-xs text-gray-500">
        Scroll to zoom &middot; Drag to pan &middot; Click node for details
      </div>
    </div>
  );
}
