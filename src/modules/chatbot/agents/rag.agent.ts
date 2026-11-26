import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatbotGraphState } from "../graph/graph.state";
import { similaritySearch } from "../services/vectorStore.service";
import { getLlm } from "../utils/llm.util";
import {
  buildRagSystemPrompt,
  buildRagUserPrompt,
  buildContextFromChunks,
  buildQueryRewritePrompt,
} from "../utils/prompt.util";

import { DocumentChunk } from "../types/chatbot.type";

const MIN_SIMILARITY_SCORE = 0.35;

// ─── Step 1: Query Rewriting ─────────────────────────────────────────────────
// Expands a short/vague query into a richer search query aligned with KB terms.

async function rewriteQuery(
  query: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<string> {
  const llm = getLlm(0);
  const { system, user } = buildQueryRewritePrompt(query, history);

  const response = await llm.invoke([new SystemMessage(system), new HumanMessage(user)]);

  const rewritten = typeof response.content === "string" ? response.content.trim() : query;

  return rewritten;
}

// ─── Step 2: Chunk Retrieval ─────────────────────────────────────────────────

async function retrieveChunks(state: ChatbotGraphState): Promise<ChatbotGraphState> {
  const searchQuery = await rewriteQuery(state.userMessage, state.conversationHistory);

  const [rewrittenChunks, rawChunks] = await Promise.all([
    similaritySearch(searchQuery, 8),
    similaritySearch(state.userMessage, 8),
  ]);

  const chunkMap = new Map<string, DocumentChunk>();
  for (const chunk of [...rewrittenChunks, ...rawChunks]) {
    const key = chunk.id ?? `${chunk.metadata.source}-${chunk.metadata.chunkIndex}`;
    const existing = chunkMap.get(key);
    if (!existing || (chunk.score ?? 0) > (existing.score ?? 0)) {
      chunkMap.set(key, chunk);
    }
  }

  const allChunks = Array.from(chunkMap.values())
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 8);

  const chunks = allChunks.filter((c) => (c.score ?? 0) >= MIN_SIMILARITY_SCORE);

  return { ...state, retrievedChunks: chunks, agentUsed: "rag_agent" };
}

// ─── Step 3: Answer Generation ───────────────────────────────────────────────

async function generateAnswer(state: ChatbotGraphState): Promise<ChatbotGraphState> {
  const llm = getLlm(0.3);
  const context = buildContextFromChunks(state.retrievedChunks);
  const systemPrompt = buildRagSystemPrompt();
  const userPrompt = buildRagUserPrompt(state.userMessage, context, state.conversationHistory);

  const messages = [new SystemMessage(systemPrompt), new HumanMessage(userPrompt)];

  const response = await llm.invoke(messages);
  const answer =
    typeof response.content === "string" ? response.content : JSON.stringify(response.content);

  return { ...state, answer };
}

// ─── Node Export ─────────────────────────────────────────────────────────────
// Each function is a pure graph node: receives state → returns partial state.

export const ragAgentNode = async (
  state: ChatbotGraphState,
): Promise<Partial<ChatbotGraphState>> => {
  const withChunks = await retrieveChunks(state);
  const withAnswer = await generateAnswer(withChunks);
  return {
    retrievedChunks: withAnswer.retrievedChunks,
    answer: withAnswer.answer,
    agentUsed: withAnswer.agentUsed,
  };
};
