import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatbotGraphState } from "../../graph/graph.state";
import { getLlm } from "../../utils/llm.util";
import { PdfMode } from "../../types/chatbot.type";

// ─── PDF Intent Detection ─────────────────────────────────────────────────────
// Cheap keyword gate first: the LLM is only called when the message mentions a PDF.

const PDF_KEYWORD = /pdf/i;
const DEFAULT_TITLE = "Rapport Sooatel";
const PDF_MODES: PdfMode[] = ["none", "append", "only"];

const PDF_INTENT_SYSTEM = `Tu analyses le message d'un utilisateur d'un ERP de restaurant (Sooatel) pour détecter une demande d'export PDF.
Réponds UNIQUEMENT avec un objet JSON : {"mode": "...", "title": "...", "request": "..."}

Valeurs de "mode" :
- "none"   : l'utilisateur ne demande pas de PDF
- "append" : l'utilisateur nomme un contenu à produire (bilan, statistiques, ventes, liste, conseils...) ET demande un PDF, même formulé simplement (ex: "donne-moi le bilan en pdf", "je veux les ventes du mois en pdf")
- "only"   : UNIQUEMENT si l'utilisateur fait explicitement référence à une réponse déjà donnée (ex: "exporte ta dernière réponse en pdf", "mets ça en pdf", "génère le pdf de ce que tu viens de dire") sans nommer de nouveau contenu. En cas de doute, choisis "append".

"title"   : titre court et professionnel du document (max 60 caractères, en français)
"request" : le message de l'utilisateur SANS la partie qui concerne le PDF (ex: "Donne-moi le bilan de la semaine et génère-le en PDF" -> "Donne-moi le bilan de la semaine"). Vide si mode = "only" ou "none".`;

interface PdfIntent {
  mode: PdfMode;
  title: string;
  request: string;
}

function parseIntent(raw: string): PdfIntent {
  const fallback: PdfIntent = { mode: "none", title: DEFAULT_TITLE, request: "" };
  try {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    const parsed = JSON.parse(cleaned) as Partial<PdfIntent>;
    const mode = PDF_MODES.find((m) => m === parsed.mode) ?? "none";
    return {
      mode,
      title: parsed.title?.trim() || DEFAULT_TITLE,
      request: parsed.request?.trim() ?? "",
    };
  } catch {
    return fallback;
  }
}

async function detectIntent(message: string): Promise<PdfIntent> {
  const response = await getLlm(0).invoke([
    new SystemMessage(PDF_INTENT_SYSTEM),
    new HumanMessage(`<user_message>\n${message}\n</user_message>`),
  ]);
  const raw = typeof response.content === "string" ? response.content : "{}";
  return parseIntent(raw);
}

export const pdfIntentNode = async (
  state: ChatbotGraphState,
): Promise<Partial<ChatbotGraphState>> => {
  if (!PDF_KEYWORD.test(state.userMessage)) {
    return { pdfMode: "none" };
  }

  try {
    const detected = await detectIntent(state.userMessage);
    // Nothing to export yet: answer the request itself, then export it
    const hasPrevious = state.conversationHistory.some((t) => t.role === "assistant");
    const intent: PdfIntent =
      detected.mode === "only" && !hasPrevious ? { ...detected, mode: "append" } : detected;

    return {
      pdfMode: intent.mode,
      pdfTitle: intent.title,
      // Downstream agents answer the request without the PDF wording
      userMessage: intent.mode === "append" && intent.request ? intent.request : state.userMessage,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[PDF] Intent detection failed: ${message}`);
    return { pdfMode: "none" };
  }
};

export function routeAfterPdfIntent(state: ChatbotGraphState): string {
  return state.pdfMode === "only" ? "pdf_export" : "supervisor";
}
