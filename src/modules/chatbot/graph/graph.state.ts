import { Annotation } from "@langchain/langgraph";
import { DocumentChunk } from "../types/chatbot.type";
import { ConversationTurn } from "../services/conversation.memory";
import { QueryResult } from "../agents/analytics/analytics.types";

// ─── Graph State Definition ─────────────────────────────────────────────────
// Each node reads from and writes to this shared state.
// userId is propagated from the HTTP layer so agents can enforce permissions.

export const ChatbotStateAnnotation = Annotation.Root({
  // Authenticated user — injected at graph invocation time from req.userId
  userId: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),

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

  conversationHistory: Annotation<ConversationTurn[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),

  analyticsResults: Annotation<QueryResult[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),

  isRecommendation: Annotation<boolean>({
    reducer: (_prev, next) => next,
    default: () => false,
  }),

  error: Annotation<string | undefined>({
    reducer: (_prev, next) => next,
    default: () => undefined,
  }),
});

export type ChatbotGraphState = typeof ChatbotStateAnnotation.State;
