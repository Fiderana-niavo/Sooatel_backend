import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatbotGraphState } from "../graph/graph.state";


const ROUTING_AGENTS = ["rag_agent", "fallback"] as const;
type RoutingTarget = (typeof ROUTING_AGENTS)[number];

const SUPERVISOR_SYSTEM = `Tu es un superviseur qui détermine quel agent doit traiter la requête d'un utilisateur d'un ERP de restaurant appelé Sooatel.
Agents disponibles :
- rag_agent : pour les questions sur les procédures, guides, règles métier et fonctionnalités de Sooatel
- fallback   : pour les questions hors scope (météo, blagues, etc.)

Réponds UNIQUEMENT avec le nom de l'agent (rag_agent ou fallback), sans aucun autre texte.`;

function getLlm(): ChatOpenAI {
  return new ChatOpenAI({
    model: "deepseek-chat",
    apiKey: process.env["DEEPSEEK_KEY"] as string,
    temperature: 0,
    configuration: {
      baseURL: "https://api.deepseek.com",
    },
  });
}

async function classifyMessage(message: string): Promise<RoutingTarget> {
  const llm = getLlm();
  const response = await llm.invoke([
    new SystemMessage(SUPERVISOR_SYSTEM),
    new HumanMessage(message),
  ]);

  const raw =
    typeof response.content === "string"
      ? response.content.trim().toLowerCase()
      : "rag_agent";

  const matched = ROUTING_AGENTS.find((a) => raw.includes(a));
  return matched ?? "rag_agent";
}

export const supervisorNode = async (
  state: ChatbotGraphState,
): Promise<Partial<ChatbotGraphState>> => {
  const target = await classifyMessage(state.userMessage);
  return { agentUsed: target };
};


export const fallbackNode = async (
  state: ChatbotGraphState,
): Promise<Partial<ChatbotGraphState>> => {
  void state;
  return {
    answer:
      "Je suis l'assistant Sooatel et je suis spécialisé dans les fonctionnalités de cet ERP. Je ne peux pas répondre à cette question. Posez-moi une question sur Sooatel (ventes, stock, employés, planning, etc.).",
    agentUsed: "fallback",
  };
};

export function routeAfterSupervisor(
  state: ChatbotGraphState,
): RoutingTarget {
  return (state.agentUsed as RoutingTarget) ?? "rag_agent";
}
