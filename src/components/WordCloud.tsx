"use client";

import { useRef, useEffect } from "react";
import cloud from "d3-cloud";
import type { WordFrequency } from "@/lib/types";

const COLORS = [
  "#a855f7",
  "#06b6d4",
  "#ec4899",
  "#22c55e",
  "#f97316",
  "#3b82f6",
  "#eab308",
  "#ef4444",
];

interface WordCloudProps {
  words: WordFrequency[];
}

export default function WordCloud({ words }: WordCloudProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || words.length === 0) return;

    const svg = svgRef.current;
    const width = svg.clientWidth || 800;
    const height = svg.clientHeight || 500;

    const maxValue = Math.max(...words.map((w) => w.value));
    const minValue = Math.min(...words.map((w) => w.value));
    const range = maxValue - minValue || 1;

    const layout = cloud()
      .size([width, height])
      .words(
        words.map((w) => ({
          text: w.text,
          size: 14 + ((w.value - minValue) / range) * 60,
          value: w.value,
        })),
      )
      .padding(4)
      .rotate(() => (Math.random() > 0.7 ? 90 : 0))
      .fontSize((d) => (d as { size: number }).size)
      .on("end", (drawnWords) => {
        // Clear previous content
        while (svg.firstChild) {
          svg.removeChild(svg.firstChild);
        }

        const g = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "g",
        );
        g.setAttribute(
          "transform",
          `translate(${width / 2},${height / 2})`,
        );

        drawnWords.forEach((word, i) => {
          const text = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text",
          );
          text.setAttribute("text-anchor", "middle");
          text.setAttribute(
            "transform",
            `translate(${word.x},${word.y}) rotate(${word.rotate})`,
          );
          text.setAttribute("font-size", `${word.size}px`);
          text.setAttribute("font-family", "system-ui, sans-serif");
          text.setAttribute("font-weight", word.size! > 40 ? "700" : "400");
          text.setAttribute("fill", COLORS[i % COLORS.length]);
          text.setAttribute("opacity", "0.9");
          text.style.cursor = "default";
          text.style.transition = "opacity 0.2s";
          text.addEventListener("mouseenter", () => {
            text.setAttribute("opacity", "1");
          });
          text.addEventListener("mouseleave", () => {
            text.setAttribute("opacity", "0.9");
          });
          text.textContent = word.text || "";
          g.appendChild(text);
        });

        svg.appendChild(g);
      });

    layout.start();
  }, [words]);

  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "#0d1117" }}>
      <svg
        ref={svgRef}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      />
    </div>
  );
}
