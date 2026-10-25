import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatbotGraphState } from "../graph/graph.state";
import { getLlm } from "../utils/llm.util";
import { ConversationTurn } from "../services/conversation.memory";

const ROUTING_AGENTS = ["rag_agent", "analytics_agent", "write_agent", "fallback"] as const;
type RoutingTarget = (typeof ROUTING_AGENTS)[number];

function buildContextBlock(history: ConversationTurn[]): string {
  if (history.length === 0) return "";
  const lines = history
    .map((t) => `${t.role === "user" ? "Utilisateur" : "Assistant"}: ${t.content.slice(0, 200)}`)
    .join("\n");
  return `\nCONTEXTE PRÉCÉDENT :\n${lines}\n`;
}

const SUPERVISOR_SYSTEM = `Tu es un superviseur qui détermine quel agent doit traiter la requête d'un utilisateur d'un ERP de restaurant appelé Sooatel.
Agents disponibles :
- rag_agent       : pour les questions sur les procédures, guides d'utilisation, règles métier et fonctionnement général de Sooatel ERP
- analytics_agent : pour TOUTES les demandes de données de l'établissement : statistiques, chiffres, KPIs, ventes, stocks, alertes, composition des recettes et ingrédients des plats, catalogue fournisseurs, stagiaires, employés, ainsi que toutes les demandes de conseils, stratégies et recommandations de gestion (ex: "combien de ventes", "quel est le stock", "ingrédients de la pizza", "recette active", "liste des employés", "chiffre d'affaires", "que me conseilles-tu", "comment optimiser le bénéfice")
- write_agent     : pour TOUTES les actions d'écriture, d'insertion ou de modification ciblées :
                    1) Enregistrer une production de plats déclarée par l'utilisateur (ex: "je vais préparer 10 pizzas", "j'ai produit 5 omelettes et 3 salades", "enregistre une production de 20 sandwichs à 14h", "je prépare des crêpes"). Les simples questions historiques sur les productions vont à analytics_agent.
                    2) Modifier ou consulter les informations / coordonnées de l'entreprise (ex: "change le mail de l'entreprise en ...", "notre adresse est ...", "mets à jour le numéro de téléphone", "quelles sont les coordonnées de l'entreprise ?", "modifie les informations de l'établissement").
- fallback        : pour les questions strictement hors scope (météo, actualités générales, blagues, etc.)

RÈGLES DE CONTEXTE :
1. Si la question est courte, une relance, une confirmation, une contestation ou un doute (ex: "tu es sûr ?", "tu est sur?", "vraiment ?", "c'est vrai ?", "pourquoi ?", "oui", "non", "détaille"), MAINTIENS OBLIGATOIREMENT le même agent que la discussion précédente (ne route JAMAIS vers fallback si le contexte parle de Sooatel). Si l'assistant vient de demander une précision pour une action d'écriture (quantité de plat, heure, coordonnées) et que l'utilisateur répond (ex: "10", "5 pour les pizzas", "à 14h"), route vers write_agent.
2. 'fallback' ne doit être choisi QUE si la question est totalement hors-sujet et sans aucun rapport avec l'ERP Sooatel (ex: "quel temps fait-il ?", "qui a gagné le match ?").

Réponds UNIQUEMENT avec le nom de l'agent (rag_agent, analytics_agent, write_agent ou fallback), sans aucun autre texte.`;

async function classifyMessage(
  message: string,
  history: ConversationTurn[],
): Promise<RoutingTarget> {
  const llm = getLlm();
  const contextBlock = buildContextBlock(history);
  const response = await llm.invoke([
    new SystemMessage(SUPERVISOR_SYSTEM),
    new HumanMessage(`${contextBlock}<user_question>\n${message}\n</user_question>`),
  ]);

  const raw =
    typeof response.content === "string" ? response.content.trim().toLowerCase() : "rag_agent";

  const matched = ROUTING_AGENTS.find((a) => raw.includes(a));
  return matched ?? "rag_agent";
}

export const supervisorNode = async (
  state: ChatbotGraphState,
): Promise<Partial<ChatbotGraphState>> => {
  const target = await classifyMessage(state.userMessage, state.conversationHistory);
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

export function routeAfterSupervisor(state: ChatbotGraphState): RoutingTarget {
  const target = state.agentUsed as RoutingTarget;
  if (ROUTING_AGENTS.includes(target)) return target;
  return "rag_agent";
}
