import { StateGraph, END, START } from "@langchain/langgraph";
import { ChatbotStateAnnotation } from "./graph.state";
import { supervisorNode, fallbackNode, routeAfterSupervisor } from "../agents/supervisor.agent";
import { ragAgentNode } from "../agents/rag.agent";

// ─── Node Names ───────────────────────────────────────────────────────────────

const SUPERVISOR = "supervisor";
const RAG_AGENT = "rag_agent";
const FALLBACK = "fallback";

// ─── Graph Builder ────────────────────────────────────────────────────────────
// Flow:
//   START → supervisor → [rag_agent | fallback] → END
//
// The supervisor classifies the intent and the conditional edge routes
// to the correct agent. Future agents (analytics_agent, action_agent)
// just need a new node + a new entry in routeAfterSupervisor.

function buildChatbotGraph() {
  const graph = new StateGraph(ChatbotStateAnnotation)
    .addNode(SUPERVISOR, supervisorNode)
    .addNode(RAG_AGENT, ragAgentNode)
    .addNode(FALLBACK, fallbackNode)

    .addEdge(START, SUPERVISOR)
    .addConditionalEdges(SUPERVISOR, routeAfterSupervisor, {
      rag_agent: RAG_AGENT,
      fallback: FALLBACK,
    })
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
