import { NextRequest, NextResponse } from "next/server";
import { analyzeDocuments } from "@/lib/claude-analyzer";
import type { Document } from "@/lib/types";

// Accepts pre-extracted document text as JSON and runs Claude analysis.
// This is the second step after /api/extract has processed each file.
export async function POST(request: NextRequest) {
  try {
    const { documents } = (await request.json()) as {
      documents: Document[];
    };

    if (!documents || documents.length === 0) {
      return NextResponse.json(
        { error: "No documents provided" },
        { status: 400 },
      );
    }

    const result = await analyzeDocuments(documents);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 },
    );
  }
}
