"use client";

import { useState, useCallback, useRef } from "react";
import type { AnalysisResult, ProcessingStatus, Document } from "@/lib/types";

async function extractFiles(
  files: File[],
  setStatus: (s: ProcessingStatus) => void,
  startProgress: number,
  progressRange: number,
): Promise<Document[]> {
  const documents: Document[] = [];
  for (let i = 0; i < files.length; i++) {
    setStatus({
      stage: "extracting",
      message: `Extracting text from file ${i + 1} of ${files.length}...`,
      progress: Math.round(startProgress + (i / files.length) * progressRange),
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
      continue;
    }

    const { documents: docs } = await res.json();
    documents.push(...docs);
  }
  return documents;
}

async function runAnalysis(
  documents: Document[],
  setStatus: (s: ProcessingStatus) => void,
): Promise<AnalysisResult> {
  setStatus({
    stage: "analyzing",
    message: `Analyzing ${documents.length} document${documents.length > 1 ? "s" : ""} with AI...`,
    progress: 60,
  });

  const analyzeRes = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documents }),
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

  return analyzeRes.json();
}

export function useAnalysis() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>({
    stage: "uploading",
    message: "Ready to upload",
    progress: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  // Keep extracted documents so we can add more files later
  const extractedDocsRef = useRef<Document[]>([]);

  const analyze = useCallback(async (files: File[]) => {
    setIsProcessing(true);
    setResult(null);
    extractedDocsRef.current = [];

    try {
      const documents = await extractFiles(files, setStatus, 10, 40);
      if (documents.length === 0) {
        throw new Error("No text could be extracted from any of the uploaded files.");
      }
      extractedDocsRef.current = documents;

      const data = await runAnalysis(documents, setStatus);

      setStatus({ stage: "building", message: "Building visualizations...", progress: 85 });
      await new Promise((r) => setTimeout(r, 500));

      setResult(data);
      setStatus({ stage: "complete", message: "Analysis complete!", progress: 100 });
    } catch (error) {
      setStatus({
        stage: "error",
        message: error instanceof Error ? error.message : "An error occurred",
        progress: 0,
      });
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const addMore = useCallback(async (files: File[]) => {
    setIsProcessing(true);

    try {
      const newDocuments = await extractFiles(files, setStatus, 10, 40);
      if (newDocuments.length === 0) {
        throw new Error("No text could be extracted from the new files.");
      }

      // Combine with previously extracted docs
      extractedDocsRef.current = [...extractedDocsRef.current, ...newDocuments];
      const allDocuments = extractedDocsRef.current;

      const data = await runAnalysis(allDocuments, setStatus);

      setStatus({ stage: "building", message: "Building visualizations...", progress: 85 });
      await new Promise((r) => setTimeout(r, 500));

      setResult(data);
      setStatus({ stage: "complete", message: "Analysis complete!", progress: 100 });
    } catch (error) {
      setStatus({
        stage: "error",
        message: error instanceof Error ? error.message : "An error occurred",
        progress: 0,
      });
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    extractedDocsRef.current = [];
    setStatus({ stage: "uploading", message: "Ready to upload", progress: 0 });
    setIsProcessing(false);
  }, []);

  return { result, status, isProcessing, analyze, addMore, reset };
}
