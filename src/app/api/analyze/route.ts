import { NextRequest, NextResponse } from "next/server";
import { extractAllPdfs } from "@/lib/pdf-extractor";
import { extractAllImages, isSupportedImage } from "@/lib/image-extractor";
import { extractZip } from "@/lib/zip-extractor";
import { analyzeDocuments } from "@/lib/claude-analyzer";
import type { Document } from "@/lib/types";

const ACCEPTED_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/zip",
  "application/x-zip-compressed",
]);

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
      if (!ACCEPTED_TYPES.has(file.type)) {
        return NextResponse.json(
          {
            error: `File "${file.name}" is not supported. Accepted: PDF, PNG, JPG, GIF, WEBP, ZIP`,
          },
          { status: 400 },
        );
      }
    }

    // Separate files by type, expanding ZIPs into their contents
    const pdfFiles: { name: string; buffer: ArrayBuffer }[] = [];
    const imageFiles: { name: string; buffer: ArrayBuffer; type: string }[] =
      [];

    for (const file of files) {
      const buffer = await file.arrayBuffer();

      if (
        file.type === "application/zip" ||
        file.type === "application/x-zip-compressed"
      ) {
        // Extract ZIP and sort contents
        const extracted = await extractZip(buffer, file.name);
        for (const entry of extracted) {
          if (entry.type === "application/pdf") {
            pdfFiles.push({ name: entry.name, buffer: entry.buffer });
          } else if (isSupportedImage(entry.type)) {
            imageFiles.push({
              name: entry.name,
              buffer: entry.buffer,
              type: entry.type,
            });
          }
        }
      } else if (file.type === "application/pdf") {
        pdfFiles.push({ name: file.name, buffer });
      } else if (isSupportedImage(file.type)) {
        imageFiles.push({ name: file.name, buffer, type: file.type });
      }
    }

    const totalFiles = pdfFiles.length + imageFiles.length;
    if (totalFiles === 0) {
      return NextResponse.json(
        {
          error:
            "No supported files found. Upload PDFs, images, or ZIPs containing them.",
        },
        { status: 400 },
      );
    }

    // Extract text from PDFs and images concurrently
    const [pdfDocs, imageDocs] = await Promise.all([
      pdfFiles.length > 0 ? extractAllPdfs(pdfFiles) : Promise.resolve([]),
      imageFiles.length > 0
        ? extractAllImages(imageFiles)
        : Promise.resolve([]),
    ]);

    const documents: Document[] = [...pdfDocs, ...imageDocs];

    if (documents.length === 0) {
      return NextResponse.json(
        { error: "No text could be extracted from the provided files" },
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
