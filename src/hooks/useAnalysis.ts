"use client";

import { useState, useCallback } from "react";
import type { AnalysisResult, ProcessingStatus, Document } from "@/lib/types";

export function useAnalysis() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>({
    stage: "uploading",
    message: "Ready to upload",
    progress: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const analyze = useCallback(async (files: File[]) => {
    setIsProcessing(true);
    setResult(null);

    try {
      // Step 1: Extract text from each file individually
      const allDocuments: Document[] = [];
      for (let i = 0; i < files.length; i++) {
        setStatus({
          stage: "extracting",
          message: `Extracting text from file ${i + 1} of ${files.length}...`,
          progress: Math.round(10 + (i / files.length) * 40),
        });

        const formData = new FormData();
        formData.append("file", files[i]);

        const res = await fetch("/api/extract", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          if (res.status === 413) {
            throw new Error(
              `File "${files[i].name}" is too large (max ~4MB per file).`,
            );
          }
          let msg = `Failed to extract "${files[i].name}"`;
          try {
            const data = await res.json();
            msg = data.error || msg;
          } catch {
            // non-JSON response
          }
          console.warn(msg);
          continue; // skip failed files, process the rest
        }

        const { documents } = await res.json();
        allDocuments.push(...documents);
      }

      if (allDocuments.length === 0) {
        throw new Error(
          "No text could be extracted from any of the uploaded files.",
        );
      }

      // Step 2: Send all extracted text to Claude for analysis
      setStatus({
        stage: "analyzing",
        message: `Analyzing ${allDocuments.length} document${allDocuments.length > 1 ? "s" : ""} with AI...`,
        progress: 60,
      });

      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents: allDocuments }),
      });

      if (!analyzeRes.ok) {
        let errorMsg = "Analysis failed";
        try {
          const text = await analyzeRes.text();
          try {
            const data = JSON.parse(text);
            errorMsg = data.error || errorMsg;
          } catch {
            errorMsg = text.slice(0, 200) || `Server error (${analyzeRes.status})`;
          }
        } catch {
          errorMsg = `Server error (${analyzeRes.status})`;
        }
        throw new Error(errorMsg);
      }

      setStatus({
        stage: "building",
        message: "Building visualizations...",
        progress: 85,
      });

      const data: AnalysisResult = await analyzeRes.json();

      await new Promise((r) => setTimeout(r, 500));

      setResult(data);
      setStatus({
        stage: "complete",
        message: "Analysis complete!",
        progress: 100,
      });
    } catch (error) {
      setStatus({
        stage: "error",
        message:
          error instanceof Error ? error.message : "An error occurred",
        progress: 0,
      });
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setStatus({ stage: "uploading", message: "Ready to upload", progress: 0 });
    setIsProcessing(false);
  }, []);

  return { result, status, isProcessing, analyze, reset };
}
