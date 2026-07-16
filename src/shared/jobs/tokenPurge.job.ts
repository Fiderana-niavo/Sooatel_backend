import AppDataSource from "../../database/data-source";
import { UserToken } from "../../database/Entities/UserToken";
import { LessThan } from "typeorm";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

async function purgeExpiredTokens(): Promise<void> {
  try {
    const result = await AppDataSource.getRepository(UserToken).delete({
      expiresAt: LessThan(new Date()),
    });
    console.log(`[TokenPurge] ${result.affected ?? 0} token(s) expiré(s) supprimé(s).`);
  } catch (err) {
    console.error("[TokenPurge] Erreur lors du nettoyage des tokens :", err);
  }
}

export function startTokenPurgeJob(): void {
  // Run once on startup, then repeat every week
  purgeExpiredTokens();
  setInterval(purgeExpiredTokens, WEEK_MS);
  console.log("[TokenPurge] Job de nettoyage des tokens démarré (intervalle : 7 jours).");
}
