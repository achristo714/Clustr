import JSZip from "jszip";

export interface ExtractedFile {
  name: string;
  buffer: ArrayBuffer;
  type: string;
}

const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

const SUPPORTED_EXTENSIONS = Object.keys(MIME_TYPES);

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot).toLowerCase() : "";
}

export async function extractZip(
  buffer: ArrayBuffer,
  zipName: string,
): Promise<ExtractedFile[]> {
  const zip = await JSZip.loadAsync(buffer);
  const files: ExtractedFile[] = [];

  const entries = Object.values(zip.files).filter(
    (entry) =>
      !entry.dir &&
      !entry.name.startsWith("__MACOSX") &&
      !entry.name.startsWith(".") &&
      SUPPORTED_EXTENSIONS.includes(getExtension(entry.name)),
  );

  for (const entry of entries) {
    const ext = getExtension(entry.name);
    const data = await entry.async("arraybuffer");
    const basename = entry.name.split("/").pop() || entry.name;

    files.push({
      name: `${zipName}/${basename}`,
      buffer: data,
      type: MIME_TYPES[ext],
    });
  }

  return files;
}
