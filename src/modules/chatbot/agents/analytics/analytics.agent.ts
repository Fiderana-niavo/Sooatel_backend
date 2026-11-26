import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatbotGraphState } from "../../graph/graph.state";
import { getUserPermissions } from "../../../../shared/services/UserPermissionCache";
import { getLlm } from "../../utils/llm.util";
import { ConversationTurn } from "../../services/conversation.memory";
import { QueryPlan } from "./analytics.types";
import { executeQueryPlan } from "./analytics.executor";
import {
  buildAnalyticsPlanSystemPrompt,
  buildAnalyticsAnswerSystemPrompt,
  buildAnalyticsAnswerUserPrompt,
} from "./analytics.prompts";

// ─── Step 1: Build the query plan ────────────────────────────────────────────
// The LLM receives the DB schema + user permissions and returns a JSON plan.

async function buildQueryPlan(
  question: string,
  grantedPermissions: string[],
  history: ConversationTurn[],
): Promise<QueryPlan> {
  const llm = getLlm(0);

  const contextBlock =
    history.length > 0
      ? `\nCONTEXTE PRÉCÉDENT (derniers échanges — identifie le sujet/entité dont il est question) :\n${history.map((t) => `${t.role === "user" ? "Utilisateur" : "Assistant"}: ${t.content.slice(0, 600)}`).join("\n")}\n`
      : "";

  const response = await llm.invoke([
    new SystemMessage(buildAnalyticsPlanSystemPrompt(grantedPermissions)),
    new HumanMessage(`${contextBlock}<user_question>\n${question}\n</user_question>`),
  ]);

  const raw = typeof response.content === "string" ? response.content.trim() : "{}";

  return parsePlan(raw);
}

function parsePlan(raw: string): QueryPlan {
  try {
    // Strip markdown code fences if the LLM adds them
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    const parsed = JSON.parse(cleaned) as QueryPlan;
    return {
      isRecommendation:
        typeof parsed.isRecommendation === "boolean" ? parsed.isRecommendation : undefined,
      directAnswer: parsed.directAnswer ?? undefined,
      intents: Array.isArray(parsed.intents) ? parsed.intents : [],
    };
  } catch {
    console.warn("[ANALYTICS] Failed to parse query plan, using empty plan.");
    return { intents: [] };
  }
}

// ─── Step 2: Generate the natural-language answer ────────────────────────────

async function generateAnswer(
  question: string,
  results: Array<{ label: string; rows: Record<string, unknown>[]; denied: boolean }>,
  history: ConversationTurn[],
): Promise<string> {
  const llm = getLlm(0.3);

  const response = await llm.invoke([
    new SystemMessage(buildAnalyticsAnswerSystemPrompt()),
    new HumanMessage(buildAnalyticsAnswerUserPrompt(question, results, history)),
  ]);

  return typeof response.content === "string" ? response.content : JSON.stringify(response.content);
}

// ─── Node Export ─────────────────────────────────────────────────────────────

export const analyticsAgentNode = async (
  state: ChatbotGraphState,
): Promise<Partial<ChatbotGraphState>> => {
  try {
    // 1. Resolve the user's effective permissions from the shared cache
    const grantedPermissions = await getUserPermissions(state.userId);

    // 2. Ask the LLM to produce a query plan adapted to these permissions
    const plan = await buildQueryPlan(
      state.userMessage,
      grantedPermissions,
      state.conversationHistory,
    );

    const isRec = Boolean(plan.isRecommendation);

    // 3. Execute DB queries if any were planned (always prioritize executing SQL)
    if (plan.intents && plan.intents.length > 0) {
      const results = await executeQueryPlan(state.userId, plan.intents);

      if (isRec) {
        return {
          analyticsResults: results,
          isRecommendation: true,
          agentUsed: "recommendation_agent",
        };
      }

      const answer = await generateAnswer(state.userMessage, results, state.conversationHistory);
      return {
        answer,
        analyticsResults: results,
        isRecommendation: false,
        agentUsed: "analytics_agent",
      };
    }

    if (isRec) {
      return {
        analyticsResults: [],
        isRecommendation: true,
        agentUsed: "recommendation_agent",
      };
    }

    // 4. If no DB queries were needed, use directAnswer
    if (plan.directAnswer) {
      return { answer: plan.directAnswer, agentUsed: "analytics_agent" };
    }

    return {
      answer: "Je n'ai pas pu déterminer les requêtes nécessaires pour répondre à cette demande.",
      agentUsed: "analytics_agent",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[ANALYTICS] Error: ${message}`);
    return {
      answer: "Une erreur s'est produite lors de l'analyse des données. Veuillez réessayer.",
      agentUsed: "analytics_agent",
      error: message,
    };
  }
};
