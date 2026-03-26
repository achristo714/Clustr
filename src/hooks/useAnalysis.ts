"use client";

import { useState, useCallback } from "react";
import type { AnalysisResult, ProcessingStatus } from "@/lib/types";

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
      setStatus({
        stage: "extracting",
        message: `Extracting text from ${files.length} PDF${files.length > 1 ? "s" : ""}...`,
        progress: 20,
      });

      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      setStatus({
        stage: "analyzing",
        message: "Analyzing content with AI...",
        progress: 50,
      });

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Analysis failed");
      }

      setStatus({
        stage: "building",
        message: "Building visualizations...",
        progress: 85,
      });

      const data: AnalysisResult = await response.json();

      // Brief delay so user sees the "building" stage
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
