import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatbotGraphState } from "../graph/graph.state";
import { similaritySearch } from "../services/vectorStore.service";
import {
  buildRagSystemPrompt,
  buildRagUserPrompt,
  buildContextFromChunks,
  buildQueryRewritePrompt,
} from "../utils/prompt.util";

// ─── RAG Agent ──────────────────────────────────────────────────────────────
// Responsible for:
//   1. Rewriting the user query for better retrieval
//   2. Retrieving relevant chunks from the vector store
//   3. Assembling the augmented prompt
//   4. Calling the LLM to generate an answer

function getLlm(temperature = 0.3): ChatOpenAI {
  return new ChatOpenAI({
    model: "deepseek-chat",
    apiKey: process.env["DEEPSEEK_KEY"] as string,
    temperature,
    configuration: {
      baseURL: "https://api.deepseek.com",
    },
  });
}

const MIN_SIMILARITY_SCORE = 0.35;

// ─── Step 1: Query Rewriting ─────────────────────────────────────────────────
// Expands a short/vague query into a richer search query aligned with KB terms.

async function rewriteQuery(query: string): Promise<string> {
  const llm = getLlm(0);
  const { system, user } = buildQueryRewritePrompt(query);

  const response = await llm.invoke([
    new SystemMessage(system),
    new HumanMessage(user),
  ]);

  const rewritten =
    typeof response.content === "string"
      ? response.content.trim()
      : query;

  console.log(`\n─── [RAG] Query rewrite ─────────────────────────────────────`);
  console.log(`  Original : "${query}"`);
  console.log(`  Rewritten: "${rewritten}"`);

  return rewritten;
}

// ─── Step 2: Chunk Retrieval ─────────────────────────────────────────────────

async function retrieveChunks(
  state: ChatbotGraphState,
): Promise<ChatbotGraphState> {
  const searchQuery = await rewriteQuery(state.userMessage);
  const allChunks = await similaritySearch(searchQuery, 6);

  console.log(`\n─── [RAG] Similarity results ────────────────────────────────`);
  allChunks.forEach((c, i) => {
    const kept = (c.score ?? 0) >= MIN_SIMILARITY_SCORE;
    console.log(`  [${i + 1}] score=${c.score?.toFixed(4)} kept=${kept} section="${c.metadata.section}"`);
  });

  const chunks = allChunks.filter((c) => (c.score ?? 0) >= MIN_SIMILARITY_SCORE);
  console.log(`  → Kept ${chunks.length}/${allChunks.length} chunks\n`);

  return { ...state, retrievedChunks: chunks, agentUsed: "rag_agent" };
}

// ─── Step 3: Answer Generation ───────────────────────────────────────────────

async function generateAnswer(
  state: ChatbotGraphState,
): Promise<ChatbotGraphState> {
  const llm = getLlm();
  const context = buildContextFromChunks(state.retrievedChunks);
  const systemPrompt = buildRagSystemPrompt();
  const userPrompt = buildRagUserPrompt(state.userMessage, context);

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(userPrompt),
  ];

  const response = await llm.invoke(messages);
  const answer =
    typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

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
