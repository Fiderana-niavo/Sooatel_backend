export const PURCHASE_STATUS = {
  CREATED: 6,
  PARTIALLY_DELIVERED: 3,
  DELIVERED: 0,
} as const;

export type PurchaseStatus = typeof PURCHASE_STATUS[keyof typeof PURCHASE_STATUS];

export const PURCHASE_STATUS_LABELS: Record<PurchaseStatus, string> = {
  [PURCHASE_STATUS.CREATED]: "Créé",
  [PURCHASE_STATUS.PARTIALLY_DELIVERED]: "Partiellement Livré",
  [PURCHASE_STATUS.DELIVERED]: "Livré",
};

export function getPurchaseStatusName(status: number): string {
  return PURCHASE_STATUS_LABELS[status as PurchaseStatus] || "Inconnu";
}
