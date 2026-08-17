export const DELIVERY_STATUS = {
  OPEN: 5,
  VALIDATED: 0,
} as const;

export type DeliveryStatus = typeof DELIVERY_STATUS[keyof typeof DELIVERY_STATUS];

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  [DELIVERY_STATUS.OPEN]: "Ouvert",
  [DELIVERY_STATUS.VALIDATED]: "Validé",
};

export function getDeliveryStatusName(status: number): string {
  return DELIVERY_STATUS_LABELS[status as DeliveryStatus] || "Inconnu";
}
