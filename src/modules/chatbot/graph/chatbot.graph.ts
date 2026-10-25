import { StateGraph, END, START } from "@langchain/langgraph";
import { ChatbotStateAnnotation, ChatbotGraphState } from "./graph.state";
import { supervisorNode, fallbackNode, routeAfterSupervisor } from "../agents/supervisor.agent";
import { ragAgentNode } from "../agents/rag.agent";
import { analyticsAgentNode } from "../agents/analytics/analytics.agent";
import { recommendationAgentNode } from "../agents/recommendation/recommendation.agent";
import { writeAgentNode } from "../agents/write/write.agent";
import { pdfIntentNode, routeAfterPdfIntent } from "../agents/pdf/pdf.intent";
import { pdfExportNode } from "../agents/pdf/pdf.agent";

// ─── Node Names ───────────────────────────────────────────────────────────────

const PDF_INTENT = "pdf_intent";
const PDF_EXPORT = "pdf_export";
const SUPERVISOR = "supervisor";
const RAG_AGENT = "rag_agent";
const ANALYTICS_AGENT = "analytics_agent";
const RECOMMENDATION_AGENT = "recommendation_agent";
const WRITE_AGENT = "write_agent";
const FALLBACK = "fallback";

// ─── Analytics Transition ─────────────────────────────────────────────────────

function routeAfterAnalytics(state: ChatbotGraphState): string {
  if (state.isRecommendation) {
    return RECOMMENDATION_AGENT;
  }
  return PDF_EXPORT;
}

// ─── Graph Builder ────────────────────────────────────────────────────────────
// Flow:
//   START → pdf_intent → [supervisor | pdf_export (export previous answer only)]
//   supervisor → [rag_agent | analytics_agent | write_agent | fallback]
//   analytics_agent → [recommendation_agent | pdf_export]
//   recommendation_agent → pdf_export
//   rag_agent → pdf_export
//   write_agent → pdf_export (write-only: targeted insertions for production & company)
//   pdf_export → END
//   fallback → END

function buildChatbotGraph() {
  const graph = new StateGraph(ChatbotStateAnnotation)
    .addNode(PDF_INTENT, pdfIntentNode)
    .addNode(PDF_EXPORT, pdfExportNode)
    .addNode(SUPERVISOR, supervisorNode)
    .addNode(RAG_AGENT, ragAgentNode)
    .addNode(ANALYTICS_AGENT, analyticsAgentNode)
    .addNode(RECOMMENDATION_AGENT, recommendationAgentNode)
    .addNode(WRITE_AGENT, writeAgentNode)
    .addNode(FALLBACK, fallbackNode)

    .addEdge(START, PDF_INTENT)
    .addConditionalEdges(PDF_INTENT, routeAfterPdfIntent, {
      [SUPERVISOR]: SUPERVISOR,
      [PDF_EXPORT]: PDF_EXPORT,
    })
    .addConditionalEdges(SUPERVISOR, routeAfterSupervisor, {
      rag_agent: RAG_AGENT,
      analytics_agent: ANALYTICS_AGENT,
      write_agent: WRITE_AGENT,
      fallback: FALLBACK,
    })
    .addConditionalEdges(ANALYTICS_AGENT, routeAfterAnalytics, {
      [RECOMMENDATION_AGENT]: RECOMMENDATION_AGENT,
      [PDF_EXPORT]: PDF_EXPORT,
    })
    .addEdge(RECOMMENDATION_AGENT, PDF_EXPORT)
    .addEdge(RAG_AGENT, PDF_EXPORT)
    .addEdge(WRITE_AGENT, PDF_EXPORT)
    .addEdge(PDF_EXPORT, END)
    .addEdge(FALLBACK, END);

  return graph.compile();
}

let compiledGraph: ReturnType<typeof buildChatbotGraph> | null = null;

export function getChatbotGraph() {
  if (!compiledGraph) {
    compiledGraph = buildChatbotGraph();
  }
  return compiledGraph;
}
