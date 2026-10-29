import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatbotGraphState } from "../../graph/graph.state";
import { getLlm } from "../../utils/llm.util";
import {
  getCompanyInfo,
  updateCompanyInfo,
  CompanyInfo,
} from "../../../../shared/utils/company-info.utils";
import { checkPermission } from "../../../../shared/permissions/permission.checker";
import { PERMISSIONS } from "../../../../shared/permissions/permission.constants";
import { buildCompanySystemPrompt, buildCompanyUserPrompt } from "./company.prompts";

interface CompanyPlan {
  action: "read" | "update";
  updates?: Partial<CompanyInfo>;
}

const LABELS: Record<keyof CompanyInfo, string> = {
  name: "Nom",
  subtitle: "Sous-titre",
  address: "Adresse",
  city: "Ville",
  phone: "Téléphone",
  mail: "Mail",
};

const NO_PERMISSION =
  "⛔ Vous n'avez pas la permission de modifier les informations de l'entreprise.";

function parsePlan(raw: string): CompanyPlan {
  try {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    const parsed = JSON.parse(cleaned) as Partial<CompanyPlan>;
    return {
      action: parsed.action === "update" ? "update" : "read",
      updates: parsed.updates && typeof parsed.updates === "object" ? parsed.updates : undefined,
    };
  } catch {
    return { action: "read" };
  }
}

function formatInfo(info: CompanyInfo): string {
  return `📋 **Informations actuelles de l'établissement :**

- **Nom** : ${info.name}
- **Sous-titre** : ${info.subtitle}
- **Adresse** : ${info.address}, ${info.city}
- **Téléphone** : ${info.phone}
- **Mail** : ${info.mail}`;
}

export async function handleCompanyWrite(
  state: ChatbotGraphState,
): Promise<Partial<ChatbotGraphState>> {
  try {
    const current = getCompanyInfo();

    const response = await getLlm(0).invoke([
      new SystemMessage(buildCompanySystemPrompt(current)),
      new HumanMessage(buildCompanyUserPrompt(state.userMessage, state.conversationHistory)),
    ]);

    const raw = typeof response.content === "string" ? response.content : "{}";
    const plan = parsePlan(raw);

    if (plan.action === "update") {
      const granted = await checkPermission(state.userId, PERMISSIONS.MANAGER_INFO);
      if (!granted) {
        return { answer: NO_PERMISSION, agentUsed: "write_agent" };
      }

      const updates = plan.updates ?? {};
      const keys = Object.keys(updates) as (keyof CompanyInfo)[];

      if (keys.length === 0) {
        return {
          answer:
            "Je n'ai détecté aucune coordonnée à modifier. Précisez par exemple : « change le mail en contact@sooatel.com » ou « mets le téléphone à 034 00 000 00 ».",
          agentUsed: "write_agent",
        };
      }

      const updated = updateCompanyInfo(updates);
      const changes = keys.map((k) => `- **${LABELS[k] ?? k}** : ${updated[k]}`).join("\n");

      const message = `✅ **Informations de l'entreprise mises à jour avec succès :**\n\n${changes}\n\n${formatInfo(updated)}`;
      return { answer: message, agentUsed: "write_agent" };
    }

    return { answer: formatInfo(current), agentUsed: "write_agent" };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[WRITE:COMPANY] Error: ${error}`);
    return {
      answer: "Une erreur s'est produite lors de la gestion des informations de l'entreprise.",
      agentUsed: "write_agent",
      error,
    };
  }
}
