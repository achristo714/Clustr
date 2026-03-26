import { extractText } from "unpdf";
import type { Document } from "./types";

export async function extractPdfText(
  file: { name: string; buffer: ArrayBuffer },
): Promise<Document> {
  const pdf = await extractText(new Uint8Array(file.buffer));

  return {
    id: crypto.randomUUID(),
    name: file.name,
    text: Array.isArray(pdf.text) ? pdf.text.join("\n") : pdf.text || "",
  };
}

export async function extractAllPdfs(
  files: { name: string; buffer: ArrayBuffer }[],
): Promise<Document[]> {
  const results = await Promise.all(files.map(extractPdfText));
  return results.filter((doc) => doc.text.trim().length > 0);
}
