import { BadRequestError } from "../../../shared/errors/AppError";

export const calculateNewCMP = (
  currentStock: number,
  currentCMP: number | null,
  receivedQuantity: number,
  newPrice: number
): number => {
  const stock = Number(currentStock) || 0;
  const receivedQty = Number(receivedQuantity) || 0;
  const price = Number(newPrice) || 0;

  if (receivedQty <= 0) {
    throw new BadRequestError("La quantité reçue doit être strictement positive.");
  }
  if (price <= 0) {
    throw new BadRequestError("Le prix d'achat doit être strictement positif pour calculer un CMP valide (Éviter un CMP à 0).");
  }

  // Si le stock actuel est à 0, le nouveau CMP est directement le nouveau prix
  if (stock === 0) {
    return price;
  }

  const cmp = currentCMP !== null ? Number(currentCMP) : 0;
  const totalQuantity = stock + receivedQty;

  const newCMP = (stock * cmp + receivedQty * price) / totalQuantity;

  // Round to 6 decimal places to match NUMERIC(15,6)
  return Math.round(newCMP * 1000000) / 1000000;
};
