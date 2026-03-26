export interface Document {
  id: string;
  name: string;
  text: string;
}

export interface Concept {
  id: string;
  label: string;
  weight: number;
  cluster: number;
  description: string;
  documents: string[];
}

export interface Connection {
  source: string;
  target: string;
  strength: number;
  reason: string;
}

export interface WordFrequency {
  text: string;
  value: number;
}

export interface DocumentSummary {
  id: string;
  name: string;
  summary: string;
  keyConcepts: string[];
}

export interface AnalysisResult {
  concepts: Concept[];
  connections: Connection[];
  wordFrequencies: WordFrequency[];
  documentSummaries: DocumentSummary[];
}

export interface ProcessingStatus {
  stage: "uploading" | "extracting" | "analyzing" | "building" | "complete" | "error";
  message: string;
  progress: number;
}
