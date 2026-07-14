import { Response } from "express";
import { ApiResponse } from "../../types/ApiResponse";

export function handleCrudError(res: Response, error: unknown) {
  if (error && typeof error === "object" && "code" in error) {
    const dbError = error as { code: string; detail?: string; message?: string };
    switch (dbError.code) {
      case "23505": {
        let fieldName = "cette valeur";
        if (dbError.detail) {
          // Fonctionne pour "Key (email)=(" et "La clé (email) = ("
          const match = dbError.detail.match(/\((.*?)\)\s*=\s*\(/);
          if (match && match[1]) {
            const rawCol = match[1];
            const translations: Record<string, string> = {
              phone_number: "numéro de téléphone",
              email_contact: "adresse e-mail",
              employee_code: "code employé",
              permission_name: "nom de la permission",
              name: "nom",
              code: "code",
              username: "nom d'utilisateur"
            };
            fieldName = `le champ '${translations[rawCol] || rawCol}'`;
          }
        }
        return res.status(400).json(ApiResponse.error(`Un enregistrement avec ${fieldName} existe déjà.`));
      }
      case "23503": {
        let tableName = "d'autres enregistrements";
        let isDeleteError = false;
        if (dbError.detail) {
          // Supporte les guillemets anglais "table" et français « table »
          const match = dbError.detail.match(/table [«"](.*?)[»"]/);
          if (match && match[1]) {
            tableName = `"${match[1]}"`;
          }
          // Supporte l'anglais et le français
          isDeleteError = dbError.detail.includes("still referenced") || dbError.detail.includes("référencée");
        }
        
        if (isDeleteError) {
          return res.status(400).json(ApiResponse.error(`Opération impossible : cette donnée est encore utilisée dans la table ${tableName}.`));
        } else {
          return res.status(400).json(ApiResponse.error(`Opération impossible : la référence requise n'existe pas dans la table ${tableName}.`));
        }
      }
      case "22P02":
        return res.status(400).json(ApiResponse.error("L'identifiant fourni est invalide ou introuvable."));
      case "23502": {
        let columnInfo = "Une information obligatoire";
        // TypeORM / Postgres met souvent le nom de la colonne dans dbError.column
        const dbErrorAny = dbError as any;
        if (dbErrorAny.column) {
          columnInfo = `Le champ "${dbErrorAny.column}"`;
        }
        return res.status(400).json(ApiResponse.error(`${columnInfo} est manquant(e).`));
      }
    }
  }

  if (error instanceof Error) {
    return res.status(500).json(ApiResponse.error(error.message));
  }
  return res.status(500).json(ApiResponse.error("Une erreur inconnue est survenue"));
}
