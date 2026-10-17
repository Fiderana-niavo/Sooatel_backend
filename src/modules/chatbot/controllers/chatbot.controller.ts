import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../../shared/types/ApiResponse";
import { getChatbotGraph } from "../graph/chatbot.graph";
import { indexAllDocuments, indexDocument } from "../services/indexing.service";
import { ChatRequest } from "../types/chatbot.type";

// ─── Chat Handler ─────────────────────────────────────────────────────────────

async function chat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as ChatRequest;
    const graph = getChatbotGraph();

    const finalState = await graph.invoke({
      sessionId: body.sessionId ?? "",
      userMessage: body.message,
      retrievedChunks: [],
      answer: "",
      agentUsed: "",
    });

    res.json(
      ApiResponse.success({
        sessionId: finalState.sessionId,
        answer: finalState.answer,
        sources: finalState.retrievedChunks,
        agentUsed: finalState.agentUsed,
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

// ─── Controller Export ────────────────────────────────────────────────────────

export const chatbotController = { chat, indexAll, indexOne };
