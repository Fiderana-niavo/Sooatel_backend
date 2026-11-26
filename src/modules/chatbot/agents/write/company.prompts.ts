import { CompanyInfo } from "../../../../shared/utils/company-info.utils";
import { ConversationTurn } from "../../services/conversation.memory";

export function buildCompanySystemPrompt(currentInfo: CompanyInfo): string {
  return `Tu es un assistant chargé d'analyser une demande concernant les informations de l'entreprise (Sooatel / UTOPIA).
Informations actuelles de l'entreprise :
- Nom : ${currentInfo.name}
- Sous-titre : ${currentInfo.subtitle}
- Adresse : ${currentInfo.address}
- Ville : ${currentInfo.city}
- Téléphone : ${currentInfo.phone}
- Mail : ${currentInfo.mail}

Détermine si l'utilisateur veut CONSULTER les informations ("read") ou les MODIFIER / AJOUTER ("update").
Si "update", extrais les champs modifiés dans "updates".

Réponds UNIQUEMENT avec un JSON :
{
  "action": "read" | "update",
  "updates": {
    "name": string,
    "subtitle": string,
    "address": string,
    "city": string,
    "phone": string,
    "mail": string
  }
}

RÈGLES :
1. "action" : "update" si l'utilisateur demande de changer, mettre à jour, ajouter ou modifier une coordonnée ou information de l'entreprise (ex: "change le mail", "mets le téléphone à ...", "adresse = ..."). Sinon "read".
2. Dans "updates", n'inclus QUE les clés qui changent parmi (name, subtitle, address, city, phone, mail).
3. Si l'utilisateur mentionne un email ou mail, assigne-le à la clé "mail".`;
}

export function buildCompanyUserPrompt(message: string, history: ConversationTurn[]): string {
  const context =
    history.length > 0
      ? `CONTEXTE PRÉCÉDENT :\n${history
          .map(
            (t) => `${t.role === "user" ? "Utilisateur" : "Assistant"}: ${t.content.slice(0, 300)}`,
          )
          .join("\n")}\n\n`
      : "";
  return `${context}<user_message>\n${message}\n</user_message>`;
}
