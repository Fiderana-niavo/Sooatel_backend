import { ChatbotGraphState } from "../../graph/graph.state";

// ─── PDF Export Eligibility ───────────────────────────────────────────────────
// Data permissions are already enforced by the analytics executor (denied results).
// Exporting a freshly generated answer is allowed only if it carries authorized content.

export interface ExportCheck {
  allowed: boolean;
  reason?: string;
}

const NO_CONTENT = "Aucun contenu à exporter en PDF pour cette demande.";
const ALL_DENIED =
  "Vous n'avez pas les permissions nécessaires pour consulter ces données, le PDF n'a donc pas été généré.";

export function checkAnswerExport(state: ChatbotGraphState): ExportCheck {
  if (state.error || !state.answer.trim() || state.agentUsed === "fallback") {
    return { allowed: false, reason: NO_CONTENT };
  }

  const results = state.analyticsResults ?? [];
  const allDenied = results.length > 0 && results.every((r) => r.denied);
  if (allDenied) {
    return { allowed: false, reason: ALL_DENIED };
  }

  return { allowed: true };
}
