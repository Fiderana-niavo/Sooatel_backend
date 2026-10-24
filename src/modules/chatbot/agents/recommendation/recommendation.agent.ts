import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatbotGraphState } from "../../graph/graph.state";
import { getLlm } from "../../utils/llm.util";
import {
  buildRecommendationSystemPrompt,
  buildRecommendationUserPrompt,
} from "./recommendation.prompts";

export const recommendationAgentNode = async (
  state: ChatbotGraphState,
): Promise<Partial<ChatbotGraphState>> => {
  try {
    console.log(`\n─── [RECOMMENDATION] Generating strategic recommendation ───`);

    const llm = getLlm(0.3);
    const results = state.analyticsResults ?? [];

    const response = await llm.invoke([
      new SystemMessage(buildRecommendationSystemPrompt()),
      new HumanMessage(
        buildRecommendationUserPrompt(
          state.userMessage,
          results,
          state.conversationHistory,
        ),
      ),
    ]);

    const answer =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);

    return {
      answer,
      agentUsed: "recommendation_agent",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[RECOMMENDATION] Error: ${message}`);
    return {
      answer:
        "Une erreur s'est produite lors de la génération de la recommandation. Veuillez réessayer.",
      agentUsed: "recommendation_agent",
      error: message,
    };
  }
};
