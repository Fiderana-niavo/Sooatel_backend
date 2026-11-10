// ─── Language Detection & Localization Utility ──────────────────────────────

export type SupportedLanguage = "fr" | "mg";

const MALAGASY_STOP_WORDS = new Set([
  "mba",
  "ovao",
  "ovay",
  "ny",
  "an'ny",
  "amin'ny",
  "aminy",
  "azafady",
  "inona",
  "ahoana",
  "iza",
  "aiza",
  "oviana",
  "firy",
  "misaotra",
  "manao",
  "hatao",
  "ataovy",
  "eto",
  "any",
  "dia",
  "ka",
  "sy",
  "fa",
  "satria",
  "rehefa",
  "tokony",
  "tsy",
  "misy",
  "manana",
  "alalana",
  "orinasa",
  "tsara",
  "ratsy",
  "ampidiro",
  "tena",
  "mila",
  "afaka",
  "ve",
  "moa",
  "koa",
  "ihany",
  "izy",
  "ianao",
  "izahay",
  "isika",
  "ianareo",
  "ireo",
  "ity",
  "ireto",
  "izany",
  "izao",
  "mombamomba",
  "hanova",
  "hanomana",
  "andraikitra",
  "fomba",
  "fanontaniana",
]);

export function detectLanguage(text: string): SupportedLanguage {
  if (!text || !text.trim()) return "fr";

  const lower = text.toLowerCase();

  // Instant compound checks for typical Malagasy prefixes / phrases
  if (lower.includes("an'ny") || lower.includes("amin'ny") || lower.includes("azafady")) {
    return "mg";
  }

  const words = lower.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, " ").split(/\s+/);

  let hits = 0;
  for (const word of words) {
    if (MALAGASY_STOP_WORDS.has(word)) {
      hits++;
    }
  }

  return hits >= 1 ? "mg" : "fr";
}

