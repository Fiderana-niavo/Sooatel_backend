import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatbotGraphState } from "../../graph/graph.state";
import { ConversationTurn } from "../../services/conversation.memory";
import { getLlm } from "../../utils/llm.util";
import { handleProductionWrite } from "./production.handler";
import { handleCompanyWrite } from "./company.handler";

export type WriteTarget = "production" | "company";

const DISPATCH_SYSTEM = `Tu détermines la cible d'une demande d'écriture/insertion ou de gestion dans un ERP de restaurant.
Cibles possibles :
- "production" : déclaration, préparation ou enregistrement d'une production de plats
- "company"    : consultation, affichage, ajout ou modification des coordonnées / informations de l'entreprise, de l'établissement ou de Sooatel (nom, adresse, téléphone, mail, contact, etc.)

Si le message est une réponse courte (confirmation, précision, valeur seule), base-toi sur le CONTEXTE PRÉCÉDENT pour déduire la cible.
Réponds UNIQUEMENT par "production" ou "company", sans aucun autre texte.`;

function buildHistoryContext(history: ConversationTurn[]): string {
  if (history.length === 0) return "";
  const lines = history
    .map((t) => `${t.role === "user" ? "Utilisateur" : "Assistant"}: ${t.content.slice(0, 200)}`)
    .join("\n");
  return `\nCONTEXTE PRÉCÉDENT :\n${lines}\n`;
}

async function classifyTarget(message: string, history: ConversationTurn[]): Promise<WriteTarget> {
  const llm = getLlm(0);
  const context = buildHistoryContext(history);

  const response = await llm.invoke([
    new SystemMessage(DISPATCH_SYSTEM),
    new HumanMessage(`${context}<user_message>\n${message}\n</user_message>`),
  ]);

  const raw = typeof response.content === "string" ? response.content.trim().toLowerCase() : "";
  return raw.includes("company") ? "company" : "production";
}

export const writeAgentNode = async (
  state: ChatbotGraphState,
): Promise<Partial<ChatbotGraphState>> => {
  const target = await classifyTarget(state.userMessage, state.conversationHistory);

  if (target === "company") {
    return handleCompanyWrite(state);
  }

  return handleProductionWrite(state);
};
