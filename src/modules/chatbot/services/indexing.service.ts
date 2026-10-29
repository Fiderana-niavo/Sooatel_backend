import * as fs from "fs";
import * as path from "path";
import { IndexingResult } from "../types/chatbot.type";
import { chunkDocument } from "../utils/chunker.util";
import { storeChunks, clearChunks, initVectorTable } from "./vectorStore.service";

// ─── Indexing Service ────────────────────────────────────────────────────────
// Orchestrates the full indexing pipeline:
// 1. Read document  2. Chunk  3. Embed + Store

const DOCS_DIR = path.join(__dirname, "../docs");

function readDocumentContent(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}

function resolveDocPath(filename: string): string {
  return path.join(DOCS_DIR, filename);
}

export async function indexDocument(filename: string, overwrite = true): Promise<IndexingResult> {
  await initVectorTable();

  const filePath = resolveDocPath(filename);
  const content = readDocumentContent(filePath);
  const source = filename;

  if (overwrite) {
    await clearChunks(source);
  }

  const chunks = chunkDocument(content, source);
  let indexed = 0;
  let failed = 0;

  // Process in batches of 20 to avoid rate limits
  const BATCH_SIZE = 20;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    try {
      const stored = await storeChunks(batch);
      indexed += stored;
    } catch (err) {
      console.error(`❌ Batch [${i}–${i + batch.length - 1}] failed:`, err);
      failed += batch.length;
    }
  }

  return { totalChunks: chunks.length, indexed, failed };
}

export async function indexAllDocuments(overwrite = true): Promise<IndexingResult> {
  await initVectorTable();

  const files = fs.readdirSync(DOCS_DIR).filter((f) => f.endsWith(".md") || f.endsWith(".txt"));

  let total = 0;
  let indexed = 0;
  let failed = 0;

  for (const file of files) {
    const result = await indexDocument(file, overwrite);
    total += result.totalChunks;
    indexed += result.indexed;
    failed += result.failed;
  }

  return { totalChunks: total, indexed, failed };
}
