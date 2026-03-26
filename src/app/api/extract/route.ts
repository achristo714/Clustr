import { NextRequest, NextResponse } from "next/server";
import { extractPdfText } from "@/lib/pdf-extractor";
import { extractImageText, isSupportedImage } from "@/lib/image-extractor";
import { extractZip } from "@/lib/zip-extractor";
import type { Document } from "@/lib/types";

// Extract text from a single file (or a ZIP of files).
// This keeps each request small to stay under Vercel's 4.5MB body limit.
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const documents: Document[] = [];

    if (
      file.type === "application/zip" ||
      file.type === "application/x-zip-compressed"
    ) {
      const extracted = await extractZip(buffer, file.name);
      for (const entry of extracted) {
        if (entry.type === "application/pdf") {
          const doc = await extractPdfText({
            name: entry.name,
            buffer: entry.buffer,
          });
          if (doc.text.trim()) documents.push(doc);
        } else if (isSupportedImage(entry.type)) {
          const doc = await extractImageText({
            name: entry.name,
            buffer: entry.buffer,
            type: entry.type,
          });
          if (doc.text.trim()) documents.push(doc);
        }
      }
    } else if (file.type === "application/pdf") {
      const doc = await extractPdfText({ name: file.name, buffer });
      if (doc.text.trim()) documents.push(doc);
    } else if (isSupportedImage(file.type)) {
      const doc = await extractImageText({
        name: file.name,
        buffer,
        type: file.type,
      });
      if (doc.text.trim()) documents.push(doc);
    } else {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}` },
        { status: 400 },
      );
    }

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Extraction error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Extraction failed",
      },
      { status: 500 },
    );
  }
}
