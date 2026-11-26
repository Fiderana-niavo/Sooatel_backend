import { BadRequestError } from "../../../shared/errors/AppError";
import {
  INJECTION_PATTERNS,
  MAX_MESSAGE_LENGTH,
} from "../constants/chatbot.constants";

/**
 * Validates and sanitizes user input for LLM processing.
 * Throws BadRequestError if input is empty, too long, or contains prompt injection patterns.
 */
export function sanitizeChatInput(input: unknown): string {
  if (typeof input !== "string") {
    throw new BadRequestError("Le message envoyé est invalide.");
  }

  // Remove null bytes and non-printable control characters (except newline, return, tab)
  const cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();

  if (cleaned.length === 0) {
    throw new BadRequestError("Le message ne peut pas être vide.");
  }

  if (cleaned.length > MAX_MESSAGE_LENGTH) {
    throw new BadRequestError(
      `Le message est trop long (${cleaned.length} caractères). La limite est de ${MAX_MESSAGE_LENGTH} caractères.`,
    );
  }

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(cleaned)) {
      throw new BadRequestError(
        "Votre message contient des instructions ou mots-clés non autorisés.",
      );
    }
  }

  return cleaned;
}
