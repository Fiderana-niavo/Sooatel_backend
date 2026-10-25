import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../../shared/types/ApiResponse";
import { getChatbotGraph } from "../graph/chatbot.graph";
import { indexAllDocuments, indexDocument } from "../services/indexing.service";
import { ChatRequest } from "../types/chatbot.type";
import { sanitizeChatInput } from "../utils/chatSanitizer.util";
import {
  getHistory,
  appendTurn,
  clearSession,
} from "../services/conversation.memory";

// ─── Chat Handler ─────────────────────────────────────────────────────────────

async function chat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as ChatRequest;
    const cleanMessage = sanitizeChatInput(body?.message);
    const sessionId = body.sessionId ?? req.userId;
    const graph = getChatbotGraph();

    const history = getHistory(sessionId);

    const finalState = await graph.invoke({
      userId: req.userId,
      sessionId,
      userMessage: cleanMessage,
      conversationHistory: history,
      retrievedChunks: [],
      answer: "",
      agentUsed: "",
    });

    // Export-only turns are not stored, so the next export still targets the real last answer
    if (finalState.pdfMode !== "only") {
      appendTurn(sessionId, { role: "user", content: cleanMessage });
      appendTurn(sessionId, { role: "assistant", content: finalState.answer });
    }

    res.json(
      ApiResponse.success({
        sessionId,
        answer: finalState.answer,
        sources: finalState.retrievedChunks,
        agentUsed: finalState.agentUsed,
        pdfExport: finalState.pdfExport,
      }),
    );
  } catch (err) {
    next(err);
  }
}

// ─── Indexing Handlers ────────────────────────────────────────────────────────

async function indexAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const overwrite = req.query["overwrite"] !== "false";
    const result = await indexAllDocuments(overwrite);
    res.json(ApiResponse.success(result));
  } catch (err) {
    next(err);
  }
}

async function indexOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filename = req.params["filename"] as string;
    const overwrite = req.query["overwrite"] !== "false";
    const result = await indexDocument(filename, overwrite);
    res.json(ApiResponse.success(result));
  } catch (err) {
    next(err);
  }
}

// ─── Session Clear Handler ────────────────────────────────────────────────────
// Called explicitly on: reset button, logout, tab close (via sendBeacon)

function clearSessionHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const sessionId = (req.params["sessionId"] as string) || req.userId;
    clearSession(sessionId);
    res.json(ApiResponse.success({ cleared: true }));
  } catch (err) {
    next(err);
  }
}

// ─── Controller Export ────────────────────────────────────────────────────────

export const chatbotController = { chat, indexAll, indexOne, clearSessionHandler };
