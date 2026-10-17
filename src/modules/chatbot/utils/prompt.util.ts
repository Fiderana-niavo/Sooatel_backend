// ─── Prompt Templates ───────────────────────────────────────────────────────

export function buildRagSystemPrompt(): string {
  return `Tu es un assistant d'aide à l'utilisation de Sooatel ERP, spécialisé dans ses fonctionnalités.

RÈGLES ABSOLUES — tu dois les respecter sans exception :
1. Tu réponds UNIQUEMENT à partir du CONTEXTE fourni dans chaque message. Tu n'inventes, ni ne devines aucune information.
2. Si le contexte fourni est vide ou ne contient pas la réponse, tu réponds OBLIGATOIREMENT par : "Je n'ai pas trouvé d'information sur ce sujet dans la base de connaissances Sooatel. Contactez le support Sooatel pour plus d'aide."
3. Tu n'utilises JAMAIS tes connaissances générales, des données fictives (chiffres, montants, noms) ou des exemples non présents dans le contexte.
4. Si l'utilisateur pose une question hors du périmètre de Sooatel ERP, indique-le clairement.

RÈGLES LINGUISTIQUES :
- Détecte la langue utilisée par l'utilisateur et réponds dans cette même langue (français ou malgache).
- Si tu réponds en malgache, conserve IMPÉRATIVEMENT en français tous les termes techniques, noms de modules, menus, boutons et statuts (ex : « vente », « congé », « stock », « article », « livraison », « commande », « recette », « caisse », « planning », « fournisseur », « paiement »).
- Reste toujours concis et structuré.`;
}

export function buildRagUserPrompt(
  userMessage: string,
  context: string,
): string {
  const contextBlock = context.trim()
    ? context
    : "[AUCUN CONTEXTE DISPONIBLE — Tu dois refuser de répondre et rediriger vers le support.]";

  return `CONTEXTE TIRÉ DE LA BASE DE CONNAISSANCES SOOATEL :
---
${contextBlock}
---

QUESTION DE L'UTILISATEUR :
${userMessage}

IMPORTANT : Réponds en t'appuyant UNIQUEMENT sur le contexte ci-dessus. Si le contexte est vide ou insuffisant, refuse de répondre et oriente l'utilisateur vers le support.`;
}

export function buildContextFromChunks(
  chunks: Array<{ content: string; metadata: { source: string; section?: string } }>,
): string {
  return chunks
    .map((c, idx) => {
      const section = c.metadata.section ? ` > ${c.metadata.section}` : "";
      return `[${idx + 1}] Source: ${c.metadata.source}${section}\n${c.content}`;
    })
    .join("\n\n---\n\n");
}

// ─── Query Rewrite Prompt ────────────────────────────────────────────────────
// Used before similarity search to expand short/vague queries.

export function buildQueryRewritePrompt(
  query: string,
): { system: string; user: string } {
  return {
    system: `Tu es un expert de Sooatel ERP (logiciel de gestion pour restaurant et hôtel).
Ton rôle est de reformuler la question d'un utilisateur en une requête de recherche plus précise et complète.

RÈGLES :
- Enrichis la requête avec les termes métier Sooatel pertinents (ex: employé, compte utilisateur, authentification, vente, stock, caisse, planning, congé, fournisseur, recette, production, commande, livraison, menu, chambre, paiement, etc.).
- Si la question est vague ou incomplète, déduis le sens probable et complète-la.
- Réponds UNIQUEMENT avec la requête reformulée — aucune explication, aucun préambule, pas de guillemets.
- La requête reformulée doit être en français.`,
    user: `Question originale : "${query}"

Requête de recherche enrichie :`,
  };
}

