import { NextRequest, NextResponse } from "next/server";
import { extractAllPdfs } from "@/lib/pdf-extractor";
import { analyzeDocuments } from "@/lib/claude-analyzer";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    if (files.length > 20) {
      return NextResponse.json(
        { error: "Maximum 20 files allowed" },
        { status: 400 },
      );
    }

    for (const file of files) {
      if (file.type !== "application/pdf") {
        return NextResponse.json(
          { error: `File "${file.name}" is not a PDF` },
          { status: 400 },
        );
      }
    }

    // Extract text from all PDFs
    const fileBuffers = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        buffer: await file.arrayBuffer(),
      })),
    );

    const documents = await extractAllPdfs(fileBuffers);

    if (documents.length === 0) {
      return NextResponse.json(
        { error: "No text could be extracted from the provided PDFs" },
        { status: 400 },
      );
    }

    // Analyze with Claude
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
