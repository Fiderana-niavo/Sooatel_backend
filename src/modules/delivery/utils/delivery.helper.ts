import { Purchase } from "../../../database/Entities/Purchase";
import { PurchaseDetail } from "../../../database/Entities/PurchaseDetail";
import { DeliveryLineDto } from "../type/delivery.type";

export const deliveryHelper = {
  calculateTotalDelivery(
    lines: DeliveryLineDto[],
    detailBySuppliedItem: Map<string, PurchaseDetail>
  ): number {
    let totalDelivery = 0;
    for (const line of lines) {
      const detail = detailBySuppliedItem.get(line.idSuppliedItem);
      const unitPrice = detail?.unitPrice ?? 0;
      totalDelivery += line.quantity * unitPrice;
    }
    return totalDelivery;
  },

  buildDetailsToInsert(
    idDelivery: string,
    lines: DeliveryLineDto[],
    detailBySuppliedItem: Map<string, PurchaseDetail>
  ) {
    return lines.map((line) => {
      const ordered = detailBySuppliedItem.get(line.idSuppliedItem);
      const unitPrice = ordered?.unitPrice ?? 0;
      return {
        idDelivery,
        idSuppliedItem: line.idSuppliedItem,
        quantity: line.quantity,
        unitPrice,
        totalAmount: line.quantity * unitPrice,
      };
    });
  },

  determineNewPurchaseStatuses(
    purchases: Purchase[],
    deliveredMap: Map<string, number>
  ): { fullyDeliveredIds: string[]; partialIds: string[]; createdIds: string[] } {
    const fullyDeliveredIds: string[] = [];
    const partialIds: string[] = [];
    const createdIds: string[] = [];

    for (const p of purchases) {
      const details = p.details ?? [];
      let totalDelivered = 0;
      let allDone = true;

      for (const d of details) {
        const delivered = deliveredMap.get(`${p.idPurchase}|${d.idSuppliedItem}`) ?? 0;
        totalDelivered += delivered;
        if (delivered < Number(d.quantity)) {
          allDone = false;
        }
      }

      if (totalDelivered === 0) {
        createdIds.push(p.idPurchase);
      } else if (allDone) {
        fullyDeliveredIds.push(p.idPurchase);
      } else {
        partialIds.push(p.idPurchase);
      }
    }

    return { fullyDeliveredIds, partialIds, createdIds };
  },

  indexPurchaseDetails(purchases: Purchase[]): Map<string, PurchaseDetail> {
    const detailBySuppliedItem = new Map<string, PurchaseDetail>();
    for (const p of purchases) {
      for (const d of p.details ?? []) {
        detailBySuppliedItem.set(d.idSuppliedItem, d);
      }
    }
    return detailBySuppliedItem;
  },

  buildDeliveredMap(deliveredRows: { id_purchase: string; id_supplied_item: string; delivered_qty: string }[]): Map<string, number> {
    const deliveredMap = new Map<string, number>();
    for (const row of deliveredRows) {
      deliveredMap.set(`${row.id_purchase}|${row.id_supplied_item}`, parseFloat(row.delivered_qty));
    }
    return deliveredMap;
  }
};
