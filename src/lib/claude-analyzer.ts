import Anthropic from "@anthropic-ai/sdk";
import type { Document, AnalysisResult } from "./types";

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. Add it in Vercel Environment Variables.",
    );
  }
  return new Anthropic({ apiKey });
}

export async function analyzeDocuments(
  documents: Document[],
): Promise<AnalysisResult> {
  const documentTexts = documents
    .map(
      (doc, i) =>
        `--- DOCUMENT ${i + 1}: "${doc.name}" (ID: ${doc.id}) ---\n${doc.text.slice(0, 8000)}`,
    )
    .join("\n\n");

  const client = getClient();
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 16384,
    messages: [
      {
        role: "user",
        content: `You are analyzing conference notes/documents to find patterns and connections. Analyze the following ${documents.length} documents and return a JSON response.

${documentTexts}

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "concepts": [
    {
      "id": "concept-1",
      "label": "Short concept name",
      "weight": 0.8,
      "cluster": 0,
      "description": "Brief description of this concept",
      "documents": ["doc-id-1", "doc-id-2"]
    }
  ],
  "connections": [
    {
      "source": "concept-1",
      "target": "concept-2",
      "strength": 0.7,
      "reason": "Why these concepts are connected"
    }
  ],
  "wordFrequencies": [
    { "text": "keyword", "value": 45 }
  ],
  "documentSummaries": [
    {
      "id": "doc-id",
      "name": "Document Name",
      "summary": "2-3 sentence summary",
      "keyConcepts": ["concept-1", "concept-2"]
    }
  ]
}

Guidelines:
- Extract 10-20 key concepts depending on document count and content richness
- Assign clusters (0-7) to group related concepts by theme
- Weight concepts 0.0-1.0 based on how prominently they appear across documents
- Connection strength 0.0-1.0 based on how strongly concepts relate
- Include 30-60 word frequencies for the word cloud (common words only, no stop words)
- Keep descriptions and reasons SHORT (under 15 words each)
- Keep document summaries to 1 sentence each
- Each document summary should reference concept IDs from the concepts array
- Focus on ideas, themes, technologies, methodologies, and key takeaways
- IMPORTANT: Your entire response must be valid, complete JSON. Do not truncate.`,
      },
    ],
  });

  // Check if the response was truncated
  if (response.stop_reason === "max_tokens") {
    throw new Error(
      "Analysis response was truncated. Try uploading fewer documents.",
    );
  }

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Parse JSON from response, handling potential markdown code fences
  let jsonStr = text.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    const result: AnalysisResult = JSON.parse(jsonStr);
    return result;
  } catch {
    throw new Error(
      "Failed to parse AI response. Please try again.",
    );
  }
}
