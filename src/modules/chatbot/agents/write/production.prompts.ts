import { ConversationTurn } from "../../services/conversation.memory";
import { formatDay, formatHour } from "../../utils/production.util";

const WEEKDAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

export function buildProductionSystemPrompt(now: Date): string {
  return `Tu extrais une déclaration de production de plats pour un ERP de restaurant (Sooatel).
Date et heure actuelles : ${WEEKDAYS[now.getDay()]} ${formatDay(now)} ${formatHour(now)}.

Réponds UNIQUEMENT avec un objet JSON, sans texte autour :
{"entries":[{"dish":"...","quantity":number|null}],"date":"YYYY-MM-DD"|null,"time":"HH:mm"|null,"notes":string|null}

RÈGLES :
1. "entries" : UNE entrée par plat. Chaque plat a SA PROPRE quantité. N'applique JAMAIS la quantité d'un plat à un autre.
2. "dish" : le nom du plat tel que l'utilisateur l'écrit, sans quantité ni article (ex: "10 pizzas" -> "pizza").
3. "quantity" : nombre exact donné pour CE plat ("une pizza" = 1). Si aucune quantité claire n'est donnée pour ce plat, mets null. Ne devine JAMAIS.
4. "date" : null si l'utilisateur ne précise pas de date (= aujourd'hui). Convertis les dates relatives ("demain", "hier", "lundi") à partir de la date actuelle.
5. "time" : format 24h HH:mm. null si l'utilisateur ne précise pas d'heure ou dit "maintenant" / "je vais préparer" (= l'heure actuelle sera utilisée).
6. "notes" : remarque explicite de l'utilisateur, sinon null.
7. Utilise le CONTEXTE PRÉCÉDENT pour compléter une réponse courte (ex: l'assistant a demandé la quantité d'un plat et l'utilisateur répond "10").`;
}

export function buildProductionUserPrompt(message: string, history: ConversationTurn[]): string {
  const context =
    history.length > 0
      ? `CONTEXTE PRÉCÉDENT :\n${history
          .map(
            (t) => `${t.role === "user" ? "Utilisateur" : "Assistant"}: ${t.content.slice(0, 400)}`,
          )
          .join("\n")}\n\n`
      : "";
  return `${context}<user_message>\n${message}\n</user_message>`;
}
