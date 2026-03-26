import Anthropic from "@anthropic-ai/sdk";
import type { Document } from "./types";

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. Add it in Vercel Environment Variables.",
    );
  }
  return new Anthropic({ apiKey });
}

type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

const SUPPORTED_IMAGE_TYPES: ImageMediaType[] = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

export function isSupportedImage(mimeType: string): boolean {
  return SUPPORTED_IMAGE_TYPES.includes(mimeType as ImageMediaType);
}

export async function extractImageText(file: {
  name: string;
  buffer: ArrayBuffer;
  type: string;
}): Promise<Document> {
  const base64 = Buffer.from(file.buffer).toString("base64");
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: file.type as ImageMediaType,
              data: base64,
            },
          },
          {
            type: "text",
            text: "Extract ALL text content from this image. Include headings, bullet points, notes, annotations, and any visible text. Preserve the structure as much as possible (use line breaks, indentation). Return ONLY the extracted text, no commentary.",
          },
        ],
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  return {
    id: crypto.randomUUID(),
    name: file.name,
    text,
  };
}

export async function extractAllImages(
  files: { name: string; buffer: ArrayBuffer; type: string }[],
): Promise<Document[]> {
  const results = await Promise.all(files.map(extractImageText));
  return results.filter((doc) => doc.text.trim().length > 0);
}
