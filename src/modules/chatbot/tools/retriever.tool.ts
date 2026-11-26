import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { similaritySearch } from "../services/vectorStore.service";
import { DocumentChunk } from "../types/chatbot.type";

// ─── Retriever Tool ─────────────────────────────────────────────────────────
// A LangGraph-compatible tool that the RAG agent can call to fetch
// relevant chunks from the vector store.

export const retrieverTool = tool(
  async (input: { query: string; topK?: number }): Promise<DocumentChunk[]> => {
    const topK = input.topK ?? 5;
    return similaritySearch(input.query, topK);
  },
  {
    name: "retrieve_context",
    description:
      "Searches the Sooatel knowledge base for passages relevant to the user's question. Returns the top-K most similar document chunks.",
    schema: z.object({
      query: z.string().describe("The search query derived from the user's question"),
      topK: z.number().optional().describe("Number of chunks to retrieve (default: 5)"),
    }),
  },
);
