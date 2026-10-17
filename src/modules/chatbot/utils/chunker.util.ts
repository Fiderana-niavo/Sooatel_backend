import { DocumentChunk } from "../types/chatbot.type";

// ─── Text Chunking Utility ──────────────────────────────────────────────────
// Splits a large markdown/text document into coherent passages.

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 150;

function splitBySection(text: string): string[] {
  // Split on markdown headers (##, ###) to get semantically coherent sections
  const sections = text.split(/(?=^#{1,3} )/m).filter((s) => s.trim().length > 0);
  return sections;
}

function splitBySentence(text: string, maxLen: number): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + " " + sentence).trim().length > maxLen) {
      if (current.trim()) chunks.push(current.trim());
      current = sentence;
    } else {
      current = current ? current + " " + sentence : sentence;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function applyOverlap(chunks: string[], overlap: number): string[] {
  if (chunks.length <= 1) return chunks;

  return chunks.map((chunk, idx) => {
    if (idx === 0) return chunk;

    const prev = chunks[idx - 1]!;
    const tail = prev.slice(-overlap);
    return tail + " " + chunk;
  });
}

export function chunkDocument(
  content: string,
  source: string,
): DocumentChunk[] {
  const sections = splitBySection(content);
  const allChunks: DocumentChunk[] = [];
  let chunkIndex = 0;

  for (const section of sections) {
    // Extract section heading for metadata
    const headingMatch = section.match(/^#{1,3} (.+)/m);
    const sectionName = headingMatch ? headingMatch[1]?.trim() : undefined;

    const rawChunks =
      section.length > CHUNK_SIZE
        ? splitBySentence(section, CHUNK_SIZE)
        : [section];

    const overlapped = applyOverlap(rawChunks, CHUNK_OVERLAP);

    for (const text of overlapped) {
      if (text.trim().length < 30) continue;

      allChunks.push({
        content: text.trim(),
        metadata: {
          source,
          section: sectionName,
          chunkIndex,
        },
      });

      chunkIndex++;
    }
  }

  return allChunks;
}
