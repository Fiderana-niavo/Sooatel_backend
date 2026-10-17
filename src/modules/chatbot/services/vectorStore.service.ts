import { Pool } from "pg";
import { DocumentChunk } from "../types/chatbot.type";
import { embedTexts, embedQuery } from "./embeddings.service";

// ─── Vector Store Service ───────────────────────────────────────────────────
// Uses pgvector for storing and searching document embeddings.
// Table: chatbot_chunks (id, content, metadata, embedding)

const TABLE = "chatbot_chunks";
const TOP_K = 5;

function getPool(): Pool {
  return new Pool({
    host: process.env["DB_HOST"],
    port: Number(process.env["DB_PORT"] ?? 5432),
    user: process.env["DB_USER"],
    password: process.env["DB_PASSWORD"],
    database: process.env["DB_NAME"],
  });
}

// ─── Setup ──────────────────────────────────────────────────────────────────

export async function initVectorTable(): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("CREATE EXTENSION IF NOT EXISTS vector");
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${TABLE} (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content     TEXT NOT NULL,
        source      TEXT NOT NULL,
        section     TEXT,
        chunk_index INTEGER,
        embedding   vector(768)
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_${TABLE}_embedding
      ON ${TABLE} USING hnsw (embedding vector_cosine_ops)
    `);
  } finally {
    client.release();
    await pool.end();
  }
}

// ─── Store Chunks ────────────────────────────────────────────────────────────

export async function storeChunks(chunks: DocumentChunk[]): Promise<number> {
  if (chunks.length === 0) return 0;

  const pool = getPool();
  const client = await pool.connect();
  let stored = 0;

  try {
    const texts = chunks.map((c) => c.content);
    const embeddings = await embedTexts(texts);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]!;
      const embedding = embeddings[i]!;
      const vectorStr = `[${embedding.join(",")}]`;

      await client.query(
        `INSERT INTO ${TABLE} (content, source, section, chunk_index, embedding)
         VALUES ($1, $2, $3, $4, $5::vector)`,
        [
          chunk.content,
          chunk.metadata.source,
          chunk.metadata.section ?? null,
          chunk.metadata.chunkIndex ?? i,
          vectorStr,
        ],
      );
      stored++;
    }
  } finally {
    client.release();
    await pool.end();
  }

  return stored;
}

// ─── Similarity Search ───────────────────────────────────────────────────────

export async function similaritySearch(
  query: string,
  topK = TOP_K,
): Promise<DocumentChunk[]> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const queryEmbedding = await embedQuery(query);
    const vectorStr = `[${queryEmbedding.join(",")}]`;

    const result = await client.query(
      `SELECT id, content, source, section, chunk_index,
              1 - (embedding <=> $1::vector) AS score
       FROM ${TABLE}
       ORDER BY embedding <=> $1::vector
       LIMIT $2`,
      [vectorStr, topK],
    );

    return result.rows.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      content: row.content as string,
      score: row.score as number,
      metadata: {
        source: row.source as string,
        section: row.section as string | undefined,
        chunkIndex: row.chunk_index as number,
      },
    }));
  } finally {
    client.release();
    await pool.end();
  }
}

// ─── Clear Store ─────────────────────────────────────────────────────────────

export async function clearChunks(source?: string): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    if (source) {
      await client.query(`DELETE FROM ${TABLE} WHERE source = $1`, [source]);
    } else {
      await client.query(`TRUNCATE TABLE ${TABLE}`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}
