import { ChatbotGraphState } from "../../graph/graph.state";
import { ConversationTurn } from "../../services/conversation.memory";
import { PdfExport } from "../../types/chatbot.type";
import { checkAnswerExport } from "./pdf.permission";

// ─── PDF Export Node ──────────────────────────────────────────────────────────
// Does not render the PDF: it validates the request and hands the markdown content
// to the frontend, which owns the single shared PDF generation function.

const DEFAULT_TITLE = "Rapport Sooatel";
const NOTHING_TO_EXPORT = "Je n'ai aucune réponse précédente à exporter en PDF.";
const EXPORT_READY = "Votre document PDF est prêt. Cliquez sur « Télécharger » ci-dessous quand vous le souhaitez.";

function lastAnswer(history: ConversationTurn[]): string | undefined {
  return [...history].reverse().find((t) => t.role === "assistant")?.content;
}

function buildExport(state: ChatbotGraphState, content: string): PdfExport {
  return { title: state.pdfTitle || DEFAULT_TITLE, content };
}

// "only": the previous answer was already produced for this user, so it is exportable
function exportPrevious(state: ChatbotGraphState): Partial<ChatbotGraphState> {
  const previous = lastAnswer(state.conversationHistory);
  if (!previous) {
    return { answer: NOTHING_TO_EXPORT, agentUsed: "pdf_agent" };
  }
  return {
    answer: EXPORT_READY,
    pdfExport: buildExport(state, previous),
    agentUsed: "pdf_agent",
  };
}

// "append": answer was just generated, make sure it carries authorized content
function exportCurrent(state: ChatbotGraphState): Partial<ChatbotGraphState> {
  const check = checkAnswerExport(state);
  if (!check.allowed) {
    return { answer: `${state.answer}\n\n> ⛔ ${check.reason}`.trim() };
  }
  return { pdfExport: buildExport(state, state.answer) };
}

export const pdfExportNode = async (
  state: ChatbotGraphState,
): Promise<Partial<ChatbotGraphState>> => {
  if (state.pdfMode === "only") return exportPrevious(state);
  if (state.pdfMode === "append") return exportCurrent(state);
  return {};
};
