import { formatDisplay } from "../../utils/production.util";
import { CreatedEntry, InsertOutcome } from "./production.types";
import { SupportedLanguage } from "../../utils/language.util";

// ─── Localized Messages (French & Malagasy) ───────────────────────────────────

export function getNoPermission(lang: SupportedLanguage): string {
  return lang === "mg"
    ? "⛔ Tsy manana alalana handrakitra production ianao."
    : "⛔ Vous n'avez pas la permission d'enregistrer une production.";
}

export function getNoEmployee(lang: SupportedLanguage): string {
  return lang === "mg"
    ? "⛔ Tsy mifandray amin'ny employé ny kaontinao. Tsy afaka mandrakitra production."
    : "⛔ Votre compte n'est pas lié à un employé. Impossible d'enregistrer une production.";
}

export function getGenericError(lang: SupportedLanguage): string {
  return lang === "mg"
    ? "Nisy olana nitranga teo am-pandikana ny production. Tsy nisy data very, avereno azafady."
    : "Une erreur s'est produite lors de l'enregistrement de la production. Aucune donnée n'a été perdue, veuillez réessayer.";
}

export function getNoEntries(lang: SupportedLanguage): string {
  return lang === "mg"
    ? "Tsy azoko ny plat homanina. Lazao ny isan'ny plat tsirairay, ohatra : « hanomana 10 pizzas sy 5 omelettes aho »."
    : "Je n'ai pas compris quel plat produire. Précisez chaque plat avec sa quantité, par exemple : « je vais préparer 10 pizzas et 5 omelettes ».";
}

export function getInvalidDate(lang: SupportedLanguage): string {
  return lang === "mg"
    ? "Tsy mety ny date na ny ora voalaza. Lazao indray (ohatra : « anio amin'ny 14h30 ») na avelao malalaka hampiasana ny ora izao."
    : "La date ou l'heure indiquée est invalide. Précisez-la à nouveau (ex: « aujourd'hui à 14h30 ») ou laissez-la vide pour utiliser l'heure actuelle.";
}

export function buildClarification(
  issues: string[],
  labels: string[] = [],
  lang: SupportedLanguage = "fr",
): string {
  const list = issues.map((issue) => `- ${issue}`).join("\n");
  const known =
    labels.length > 0
      ? lang === "mg"
        ? `\n\nPlats misy : ${labels.join(", ")}.`
        : `\n\nPlats disponibles : ${labels.join(", ")}.`
      : "";

  const hint =
    lang === "mg"
      ? "Ny plat tsirairay dia tokony hanana article sy quantité mazava. Lazao ireo dia horaisiko. Tsy mbola nisy voarakitra hatreto."
      : "Chaque plat doit avoir son propre article et sa propre quantité. Précisez-les et je les enregistrerai. Rien n'a été enregistré pour l'instant.";

  const prefix =
    lang === "mg"
      ? "Tsy afaka mandrakitra ity production ity aho :"
      : "Je ne peux pas enregistrer cette production :";

  return `${prefix}\n\n${list}${known}\n\n${hint}`;
}

function formatLine(label: string, quantity: number): string {
  return `- **${label}** : ${quantity}`;
}

function formatQty(value: number): string {
  return Number(value.toFixed(2)).toLocaleString("fr-FR");
}

function buildStockWarning(entry: CreatedEntry, lang: SupportedLanguage): string | null {
  const { shortages, issue } = entry.stock;
  if (issue) return `- **${entry.label}** : ${issue}`;
  if (shortages.length === 0) return null;
  const lines = shortages
    .map(
      (s) =>
        lang === "mg"
          ? `  - ${s.ingredient} : ilaina ${formatQty(s.required)}, misy ${formatQty(s.available)}`
          : `  - ${s.ingredient} : nécessaire ${formatQty(s.required)}, disponible ${formatQty(s.available)}`,
    )
    .join("\n");
  const label = lang === "mg" ? "stock tsy ampy" : "stock insuffisant";
  return `- **${entry.label}** : ${label}\n${lines}`;
}

function buildStockSection(created: CreatedEntry[], lang: SupportedLanguage): string {
  const warnings = created
    .map((e) => buildStockWarning(e, lang))
    .filter((w): w is string => w !== null);
  if (warnings.length === 0) return "";
  const title =
    lang === "mg"
      ? "\n\n⚠️ **Stock tsy ampy ho an'ny validation** (voatahiry ny brouillon, saingy tsy azo valider-na raha tsy fenoina ny stock) :\n\n"
      : "\n\n⚠️ **Stock insuffisant pour la validation** (le brouillon est conservé, mais il ne pourra pas être validé tant que le stock n'est pas réapprovisionné) :\n\n";
  return `${title}${warnings.join("\n")}`;
}

export function buildSuccess(
  outcome: InsertOutcome,
  date: Date,
  lang: SupportedLanguage = "fr",
): string {
  const parts: string[] = [];

  if (outcome.created.length > 0) {
    const lines = outcome.created.map((e) => formatLine(e.label, e.quantity)).join("\n");
    const intro =
      lang === "mg"
        ? `✅ Production voarakitra ho an'ny ${formatDisplay(date)} :\n\n${lines}\n\nMbola **brouillon** izy io : validez-o ao amin'ny pejy Production mba hanavaozana ny stock.${buildStockSection(outcome.created, lang)}`
        : `✅ Production enregistrée pour le ${formatDisplay(date)} :\n\n${lines}\n\nElle est en **brouillon** : validez-la depuis la page Production pour mettre à jour les stocks.${buildStockSection(outcome.created, lang)}`;
    parts.push(intro);
  }

  if (outcome.failed.length > 0) {
    const lines = outcome.failed.map((f) => `- **${f.label}** : ${f.reason}`).join("\n");
    const warning = lang === "mg" ? `⚠️ Tsy voarakitra :\n\n${lines}` : `⚠️ Non enregistré :\n\n${lines}`;
    parts.push(warning);
  }

  return parts.join("\n\n");
}
