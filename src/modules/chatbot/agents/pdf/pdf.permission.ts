import { ChatbotGraphState } from "../../graph/graph.state";
import { detectLanguage } from "../../utils/language.util";

// ─── PDF Export Eligibility ───────────────────────────────────────────────────
// Data permissions are already enforced by the analytics executor (denied results).
// Exporting a freshly generated answer is allowed only if it carries authorized content.

export interface ExportCheck {
  allowed: boolean;
  reason?: string;
}

const MESSAGES = {
  fr: {
    noContent: "Aucun contenu à exporter en PDF pour cette demande.",
    allDenied:
      "Vous n'avez pas les permissions nécessaires pour consulter ces données, le PDF n'a donc pas été généré.",
  },
  mg: {
    noContent: "Tsy misy vontoatiny azo aondrana ho PDF amin'ity fangatahana ity.",
    allDenied:
      "Tsy manana alalana hijery ireto angona ireto ianao, ka tsy voaforona ny PDF.",
  },
};

export function checkAnswerExport(state: ChatbotGraphState): ExportCheck {
  const lang = detectLanguage(state.userMessage);

  if (state.error || !state.answer.trim() || state.agentUsed === "fallback") {
    return { allowed: false, reason: MESSAGES[lang].noContent };
  }

  const results = state.analyticsResults ?? [];
  const allDenied = results.length > 0 && results.every((r) => r.denied);
  if (allDenied) {
    return { allowed: false, reason: MESSAGES[lang].allDenied };
  }

  return { allowed: true };
}
