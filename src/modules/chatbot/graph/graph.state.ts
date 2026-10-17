import { Annotation } from "@langchain/langgraph";
import { DocumentChunk } from "../types/chatbot.type";

// ─── Graph State Definition ─────────────────────────────────────────────────
// Each node reads from and writes to this shared state.

export const ChatbotStateAnnotation = Annotation.Root({
  sessionId: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),

  userMessage: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),

  retrievedChunks: Annotation<DocumentChunk[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),

  answer: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),

  agentUsed: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "rag_agent",
  }),

  error: Annotation<string | undefined>({
    reducer: (_prev, next) => next,
    default: () => undefined,
  }),
});

export type ChatbotGraphState = typeof ChatbotStateAnnotation.State;
