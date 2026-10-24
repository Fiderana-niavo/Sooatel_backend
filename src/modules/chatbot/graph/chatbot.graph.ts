import { StateGraph, END, START } from "@langchain/langgraph";
import { ChatbotStateAnnotation, ChatbotGraphState } from "./graph.state";
import { supervisorNode, fallbackNode, routeAfterSupervisor } from "../agents/supervisor.agent";
import { ragAgentNode } from "../agents/rag.agent";
import { analyticsAgentNode } from "../agents/analytics/analytics.agent";
import { recommendationAgentNode } from "../agents/recommendation/recommendation.agent";

// ─── Node Names ───────────────────────────────────────────────────────────────

const SUPERVISOR = "supervisor";
const RAG_AGENT = "rag_agent";
const ANALYTICS_AGENT = "analytics_agent";
const RECOMMENDATION_AGENT = "recommendation_agent";
const FALLBACK = "fallback";

// ─── Analytics Transition ─────────────────────────────────────────────────────

function routeAfterAnalytics(state: ChatbotGraphState): string {
  if (state.isRecommendation) {
    return RECOMMENDATION_AGENT;
  }
  return END;
}

// ─── Graph Builder ────────────────────────────────────────────────────────────
// Flow:
//   START → supervisor → [rag_agent | analytics_agent | fallback]
//   analytics_agent → [recommendation_agent | END]
//   recommendation_agent → END
//   rag_agent → END
//   fallback → END

function buildChatbotGraph() {
  const graph = new StateGraph(ChatbotStateAnnotation)
    .addNode(SUPERVISOR, supervisorNode)
    .addNode(RAG_AGENT, ragAgentNode)
    .addNode(ANALYTICS_AGENT, analyticsAgentNode)
    .addNode(RECOMMENDATION_AGENT, recommendationAgentNode)
    .addNode(FALLBACK, fallbackNode)

    .addEdge(START, SUPERVISOR)
    .addConditionalEdges(SUPERVISOR, routeAfterSupervisor, {
      rag_agent: RAG_AGENT,
      analytics_agent: ANALYTICS_AGENT,
      fallback: FALLBACK,
    })
    .addConditionalEdges(ANALYTICS_AGENT, routeAfterAnalytics, {
      [RECOMMENDATION_AGENT]: RECOMMENDATION_AGENT,
      [END]: END,
    })
    .addEdge(RECOMMENDATION_AGENT, END)
    .addEdge(RAG_AGENT, END)
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

