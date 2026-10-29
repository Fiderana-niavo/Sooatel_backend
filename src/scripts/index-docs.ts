import "reflect-metadata";
import * as dotenv from "dotenv";
dotenv.config();

import { indexAllDocuments } from "../modules/chatbot/services/indexing.service";

// ─── Index Docs Script ────────────────────────────────────────────────────────
// Run with: npm run index
// Indexes all .md and .txt files in src/modules/chatbot/docs/ into pgvector.
// Safe to re-run: existing chunks are cleared before re-indexing (overwrite=true).

async function run(): Promise<void> {
  console.log("📚 Starting knowledge base indexing...\n");

  try {
    const result = await indexAllDocuments(true);

    console.log("─────────────────────────────────");
    console.log(`✅ Indexing complete`);
    console.log(`   Total chunks : ${result.totalChunks}`);
    console.log(`   Indexed      : ${result.indexed}`);
    console.log(`   Failed       : ${result.failed}`);
    console.log("─────────────────────────────────");

    if (result.failed > 0) {
      console.warn(`⚠️  ${result.failed} chunk(s) failed to index.`);
      process.exit(1);
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Indexing failed:", err);
    process.exit(1);
  }
}

run();
