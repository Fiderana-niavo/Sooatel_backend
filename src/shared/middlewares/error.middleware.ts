import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { ApiResponse } from "../types/ApiResponse";

const PG_FIELD_TRANSLATIONS: Record<string, string> = {
  phone_number: "numéro de téléphone",
  email_contact: "adresse e-mail",
  employee_code: "code employé",
  permission_name: "nom de la permission",
  name: "nom",
  code: "code",
  username: "nom d'utilisateur",
};

export const globalErrorMiddleware = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // 1. Business errors (AppError, NotFoundError, etc.)
  if (err instanceof AppError) {
    res.status(err.statusCode).json(ApiResponse.error(err.message));
    return;
  }

  // 2. PostgreSQL / TypeORM errors
  const dbError = (err as Record<string, unknown>)?.driverError ?? err;
  const code = (dbError as Record<string, unknown>)?.code;
  const detail = (dbError as Record<string, unknown>)?.detail as string | undefined;

  if (typeof code === "string") {
    switch (code) {
      case "23505": { // Unique violation
        const match = detail?.match(/\((.*?)\)\s*=\s*\(/);
        const rawCol = match?.[1] ?? "";
        const label = PG_FIELD_TRANSLATIONS[rawCol];
        const fieldName = label ? `le champ '${label}'` : "cette valeur";
        res.status(400).json(ApiResponse.error(`Un enregistrement avec ${fieldName} existe déjà.`));
        return;
      }
      case "23503": { // FK violation
        const isDelete = detail?.includes("still referenced") || detail?.includes("référencée");
        const tableMatch = detail?.match(/table [«"](.*?)[»"]/);
        const table = tableMatch ? `"${tableMatch[1]}"` : "d'autres enregistrements";
        const msg = isDelete
          ? `Opération impossible : cette donnée est encore utilisée dans la table ${table}.`
          : `Opération impossible : la référence requise n'existe pas dans la table ${table}.`;
        res.status(400).json(ApiResponse.error(msg));
        return;
      }
      case "22P02":
        res.status(400).json(ApiResponse.error("L'identifiant fourni est invalide ou introuvable."));
        return;
      case "23502": {
        const col = (dbError as Record<string, unknown>)?.column as string | undefined;
        const field = col ? `Le champ "${col}"` : "Une information obligatoire";
        res.status(400).json(ApiResponse.error(`${field} est manquant(e).`));
        return;
      }
    }
  }

  // 3. Fallback
  const message = err instanceof Error ? err.message : "Une erreur inconnue est survenue.";
  res.status(500).json(ApiResponse.error(message));
};
