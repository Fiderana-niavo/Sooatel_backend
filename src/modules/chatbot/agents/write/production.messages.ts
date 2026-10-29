import { formatDisplay } from "../../utils/production.util";
import { CreatedEntry, InsertOutcome } from "./production.types";

// ─── User-facing Messages (French) ───────────────────────────────────────────

export const NO_PERMISSION = "⛔ Vous n'avez pas la permission d'enregistrer une production.";
export const NO_EMPLOYEE =
  "⛔ Votre compte n'est pas lié à un employé. Impossible d'enregistrer une production.";
export const GENERIC_ERROR =
  "Une erreur s'est produite lors de l'enregistrement de la production. Aucune donnée n'a été perdue, veuillez réessayer.";
export const NO_ENTRIES =
  "Je n'ai pas compris quel plat produire. Précisez chaque plat avec sa quantité, par exemple : « je vais préparer 10 pizzas et 5 omelettes ».";
export const INVALID_DATE =
  "La date ou l'heure indiquée est invalide. Précisez-la à nouveau (ex: « aujourd'hui à 14h30 ») ou laissez-la vide pour utiliser l'heure actuelle.";

const HINT =
  "Chaque plat doit avoir son propre article et sa propre quantité. Précisez-les et je les enregistrerai. Rien n'a été enregistré pour l'instant.";

export function buildClarification(issues: string[], labels: string[] = []): string {
  const list = issues.map((issue) => `- ${issue}`).join("\n");
  const known = labels.length > 0 ? `\n\nPlats disponibles : ${labels.join(", ")}.` : "";
  return `Je ne peux pas enregistrer cette production :\n\n${list}${known}\n\n${HINT}`;
}

function formatLine(label: string, quantity: number): string {
  return `- **${label}** : ${quantity}`;
}

function formatQty(value: number): string {
  return Number(value.toFixed(2)).toLocaleString("fr-FR");
}

function buildStockWarning(entry: CreatedEntry): string | null {
  const { shortages, issue } = entry.stock;
  if (issue) return `- **${entry.label}** : ${issue}`;
  if (shortages.length === 0) return null;
  const lines = shortages
    .map(
      (s) =>
        `  - ${s.ingredient} : nécessaire ${formatQty(s.required)}, disponible ${formatQty(s.available)}`,
    )
    .join("\n");
  return `- **${entry.label}** : stock insuffisant\n${lines}`;
}

function buildStockSection(created: CreatedEntry[]): string {
  const warnings = created.map(buildStockWarning).filter((w): w is string => w !== null);
  if (warnings.length === 0) return "";
  return `\n\n⚠️ **Stock insuffisant pour la validation** (le brouillon est conservé, mais il ne pourra pas être validé tant que le stock n'est pas réapprovisionné) :\n\n${warnings.join("\n")}`;
}

export function buildSuccess(outcome: InsertOutcome, date: Date): string {
  const parts: string[] = [];

  if (outcome.created.length > 0) {
    const lines = outcome.created.map((e) => formatLine(e.label, e.quantity)).join("\n");
    parts.push(
      `✅ Production enregistrée pour le ${formatDisplay(date)} :\n\n${lines}\n\nElle est en **brouillon** : validez-la depuis la page Production pour mettre à jour les stocks.${buildStockSection(outcome.created)}`,
    );
  }

  if (outcome.failed.length > 0) {
    const lines = outcome.failed.map((f) => `- **${f.label}** : ${f.reason}`).join("\n");
    parts.push(`⚠️ Non enregistré :\n\n${lines}`);
  }

  return parts.join("\n\n");
}
