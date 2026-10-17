// ─── Request / Response Types ───────────────────────────────────────────────

export interface ChatRequest {
  sessionId?: string;
  message: string;
}

export interface ChatResponse {
  sessionId?: string;
  answer: string;
  sources?: DocumentChunk[];
  agentUsed?: string;
}

// ─── RAG / Vector Store Types ───────────────────────────────────────────────

export interface DocumentChunk {
  id?: string;
  content: string;
  metadata: ChunkMetadata;
  score?: number;
}

export interface ChunkMetadata {
  source: string;
  section?: string;
  chunkIndex?: number;
}

export interface IndexingResult {
  totalChunks: number;
  indexed: number;
  failed: number;
}

// ─── LangGraph State Types ──────────────────────────────────────────────────

export interface ChatbotState {
  sessionId?: string;
  userMessage: string;
  retrievedChunks: DocumentChunk[];
  answer: string;
  agentUsed: string;
  error?: string;
}
