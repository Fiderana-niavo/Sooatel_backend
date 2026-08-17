import AppDataSource from "../../../database/data-source";
import { Purchase } from "../../../database/Entities/Purchase";
import { ProductDelivery } from "../../../database/Entities/ProductDelivery";
import { DeliveryDetail } from "../../../database/Entities/DeliveryDetail";
import { PurchaseDelivery } from "../../../database/Entities/PurchaseDelivery";
import { PURCHASE_STATUS, getPurchaseStatusName } from "../../purchases/constants/purchase.constants";
import { DELIVERY_STATUS, getDeliveryStatusName } from "../constants/delivery.constants";
import { CreateDeliveryDto } from "../type/delivery.type";
import { BadRequestError, NotFoundError } from "../../../shared/errors/AppError";
import { deliveryHelper } from "../utils/delivery.helper";
import { Paginated } from "../../../shared/types/Paginated";
import { StockMovement } from "../../../database/Entities/StockMovement";
import { Item } from "../../../database/Entities/Item";
import { STOCK_MOVEMENT_TYPE } from "../../items/constants/stock.constants";

export class DeliveryService {
  /**
   * Returns all pending purchases (CREATED or PARTIALLY_DELIVERED) for a supplier,
   * along with their details and already delivered quantity per item (calculated in a single query).
   */
  async getPendingBySupplier(idSupplier: string, excludeDeliveryId?: string): Promise<unknown> {
    // 1 - Load all pending purchases for the supplier with their details in a single query
    const purchasesQuery = AppDataSource.getRepository(Purchase)
      .createQueryBuilder("p")
      .select([
        "p.idPurchase",
        "p.ref",
        "p.purchaseDate",
        "p.totalAmount",
        "p.status",
        "purchaser.idEmployee",
        "purchaser.name",
        "purchaser.lastname",
        "detail.idPurchaseDetail",
        "detail.idSuppliedItem",
        "detail.quantity",
        "detail.unitPrice",
        "detail.totalAmount",
        "si.idSuppliedItem",
        "item.idItem",
        "item.label",
        "item.ref",
      ])
      .leftJoin("p.purchaser", "purchaser")
      .leftJoin("p.details", "detail")
      .leftJoin("detail.suppliedItem", "si")
      .leftJoin("si.item", "item")
      .where("p.idSupplier = :idSupplier", { idSupplier })
      .andWhere((qb) => {
        const subQuery = qb.where("p.status IN (:...statuses)", {
          statuses: [PURCHASE_STATUS.CREATED, PURCHASE_STATUS.PARTIALLY_DELIVERED],
        });
        if (excludeDeliveryId) {
          return subQuery.orWhere(
            "p.idPurchase IN (SELECT pd.id_purchase FROM purchase_delivery pd WHERE pd.id_delivery = :excludeDeliveryId)",
            { excludeDeliveryId }
          );
        }
        return subQuery;
      })
      .orderBy("p.purchaseDate", "DESC");

    const purchases = await purchasesQuery.getMany();

    if (purchases.length === 0) return [];

    const purchaseIds = purchases.map((p) => p.idPurchase);

    // 2 - Calculate already delivered quantities per item for these purchases (single query)
    const queryParams: any[] = [purchaseIds];
    let excludeCondition = "";
    if (excludeDeliveryId) {
      excludeCondition = "AND pd.id_delivery != $2";
      queryParams.push(excludeDeliveryId);
    }

    const deliveredQtyRows = await AppDataSource.query(
      `SELECT pd.id_purchase, dd.id_supplied_item, COALESCE(SUM(dd.quantity), 0) AS delivered_qty
       FROM purchase_delivery pd
       JOIN delivery_details dd ON dd.id_delivery = pd.id_delivery
       WHERE pd.id_purchase = ANY($1) ${excludeCondition}
       GROUP BY pd.id_purchase, dd.id_supplied_item`,
      queryParams
    ) as { id_purchase: string; id_supplied_item: string; delivered_qty: string }[];

    const deliveredMap = deliveryHelper.buildDeliveredMap(deliveredQtyRows);

    return purchases.map((p) => ({
      idPurchase: p.idPurchase,
      ref: p.ref,
      purchaseDate: p.purchaseDate,
      totalAmount: p.totalAmount,
      status: getPurchaseStatusName(p.status),
      purchaser: p.purchaser,
      details: (p.details ?? []).map((d) => {
        const alreadyDelivered = deliveredMap.get(`${p.idPurchase}|${d.idSuppliedItem}`) ?? 0;
        return {
          idPurchaseDetail: d.idPurchaseDetail,
          idSuppliedItem: d.idSuppliedItem,
          quantity: d.quantity,
          unitPrice: d.unitPrice,
          totalAmount: d.totalAmount,
          alreadyDelivered,
          remaining: Math.max(0, Number(d.quantity) - alreadyDelivered),
          suppliedItem: d.suppliedItem,
        };
      }),
    }));
  }

  async createDelivery(dto: CreateDeliveryDto): Promise<{ idDelivery: string; ref: string }> {
    if (!dto.idPurchases || dto.idPurchases.length === 0) {
      throw new BadRequestError("Au moins une commande est requise.");
    }
    if (!dto.lines || dto.lines.length === 0) {
      throw new BadRequestError("Au moins une ligne de livraison est requise.");
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1 - Validate purchases and load their details in a single query
      const purchases = await queryRunner.manager
        .createQueryBuilder(Purchase, "p")
        .leftJoinAndSelect("p.details", "detail")
        .where("p.idPurchase IN (:...ids)", { ids: dto.idPurchases })
        .getMany();

      if (purchases.length !== dto.idPurchases.length) {
        throw new NotFoundError("Une ou plusieurs commandes introuvables.");
      }

      // Index details of all purchases by idSuppliedItem
      const detailBySuppliedItem = deliveryHelper.indexPurchaseDetails(purchases);

      // 2 - Calculate total delivery amount
      const totalDelivery = deliveryHelper.calculateTotalDelivery(dto.lines, detailBySuppliedItem);

      // 3 - Create delivery (ref generated by SQL trigger)
      const delivery = new ProductDelivery();
      delivery.deliveryDate = new Date();
      delivery.totalAmount = totalDelivery;
      delivery.status = DELIVERY_STATUS.OPEN;
      const saved = await queryRunner.manager.save(ProductDelivery, delivery);

      // 4 - Insert delivery details in batch
      const detailsToInsert = deliveryHelper.buildDetailsToInsert(saved.idDelivery, dto.lines, detailBySuppliedItem);

      await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(DeliveryDetail)
        .values(detailsToInsert)
        .execute();

      // 5 - Insert purchase_delivery junctions in batch
      const purchaseDeliveriesToInsert = dto.idPurchases.map((idPurchase) => ({
        idPurchase,
        idDelivery: saved.idDelivery,
      }));

      await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(PurchaseDelivery)
        .values(purchaseDeliveriesToInsert)
        .execute();

      // 6 - Calculate already delivered quantities for each affected purchase (single query)
      const deliveredRows = await queryRunner.manager.query(
        `SELECT pd.id_purchase, dd.id_supplied_item, COALESCE(SUM(dd.quantity), 0) AS delivered_qty
         FROM purchase_delivery pd
         JOIN delivery_details dd ON dd.id_delivery = pd.id_delivery
         WHERE pd.id_purchase = ANY($1)
         GROUP BY pd.id_purchase, dd.id_supplied_item`,
        [dto.idPurchases]
      ) as { id_purchase: string; id_supplied_item: string; delivered_qty: string }[];

      const deliveredMap = deliveryHelper.buildDeliveredMap(deliveredRows);

      // 7 - Determine new status for each purchase and update them in batch
      const { fullyDeliveredIds, partialIds } = deliveryHelper.determineNewPurchaseStatuses(purchases, deliveredMap);

      if (fullyDeliveredIds.length > 0) {
        await queryRunner.manager
          .createQueryBuilder()
          .update(Purchase)
          .set({ status: PURCHASE_STATUS.DELIVERED })
          .whereInIds(fullyDeliveredIds)
          .execute();
      }

      if (partialIds.length > 0) {
        await queryRunner.manager
          .createQueryBuilder()
          .update(Purchase)
          .set({ status: PURCHASE_STATUS.PARTIALLY_DELIVERED })
          .whereInIds(partialIds)
          .execute();
      }

      await queryRunner.commitTransaction();

      return { idDelivery: saved.idDelivery, ref: saved.ref };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async validateDelivery(idDelivery: string, idOperator: string): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const delivery = await queryRunner.manager.getRepository(ProductDelivery).findOne({
        where: { idDelivery },
        relations: {
          deliveryDetails: {
            suppliedItem: {
              item: true
            }
          }
        }
      });

      if (!delivery) throw new NotFoundError("Livraison introuvable.");
      if (delivery.status === DELIVERY_STATUS.VALIDATED) throw new BadRequestError("Livraison déjà validée.");

      delivery.status = DELIVERY_STATUS.VALIDATED;
      await queryRunner.manager.save(ProductDelivery, delivery);

      const itemsToUpdate = new Map<string, Item>();
      const stockMovements: StockMovement[] = [];

      if (delivery.deliveryDetails) {
        for (let i = 0; i < delivery.deliveryDetails.length; i++) {
          const detail = delivery.deliveryDetails[i];
          if (!detail || !detail.suppliedItem || !detail.suppliedItem.item) continue;
          
          const item = detail.suppliedItem.item;
          
          const movement = new StockMovement();
          movement.ref = `MVT-${Date.now().toString(36).toUpperCase()}-${i}`;
          movement.idItem = item.idItem;
          movement.movementDate = new Date();
          movement.quantity = detail.quantity;
          movement.movementType = STOCK_MOVEMENT_TYPE.RECEPTION_FOURNISSEUR;
          movement.idOperator = idOperator;
          
          stockMovements.push(movement);
          
          // Update item quantity
          if (!itemsToUpdate.has(item.idItem)) {
            itemsToUpdate.set(item.idItem, item);
          }
          const mappedItem = itemsToUpdate.get(item.idItem)!;
          mappedItem.quantity = Number(mappedItem.quantity ?? 0) + Number(detail.quantity);
        }
      }

      if (stockMovements.length > 0) {
        await queryRunner.manager.save(StockMovement, stockMovements);
      }
      
      const itemsArray = Array.from(itemsToUpdate.values());
      if (itemsArray.length > 0) {
        await queryRunner.manager.save(Item, itemsArray);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteDelivery(idDelivery: string): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const delivery = await queryRunner.manager.getRepository(ProductDelivery).findOne({
        where: { idDelivery },
        relations: { purchaseDeliveries: true }
      });

      if (!delivery) throw new NotFoundError("Livraison introuvable.");
      if (delivery.status === DELIVERY_STATUS.VALIDATED) throw new BadRequestError("Impossible de supprimer une livraison validée.");

      const purchaseIds = delivery.purchaseDeliveries?.map(pd => pd.idPurchase) || [];

      // 1. Delete details and links
      await queryRunner.manager.delete(DeliveryDetail, { idDelivery });
      await queryRunner.manager.delete(PurchaseDelivery, { idDelivery });
      
      // 2. Delete delivery
      await queryRunner.manager.delete(ProductDelivery, { idDelivery });

      // 3. Recalculate purchase statuses if any purchase was linked
      if (purchaseIds.length > 0) {
        const purchases = await queryRunner.manager
          .createQueryBuilder(Purchase, "p")
          .leftJoinAndSelect("p.details", "detail")
          .where("p.idPurchase IN (:...ids)", { ids: purchaseIds })
          .getMany();

        const deliveredRows = await queryRunner.manager.query(
          `SELECT pd.id_purchase, dd.id_supplied_item, COALESCE(SUM(dd.quantity), 0) AS delivered_qty
           FROM purchase_delivery pd
           JOIN delivery_details dd ON dd.id_delivery = pd.id_delivery
           WHERE pd.id_purchase = ANY($1)
           GROUP BY pd.id_purchase, dd.id_supplied_item`,
          [purchaseIds]
        ) as { id_purchase: string; id_supplied_item: string; delivered_qty: string }[];

        const deliveredMap = deliveryHelper.buildDeliveredMap(deliveredRows);
        const { fullyDeliveredIds, partialIds, createdIds } = deliveryHelper.determineNewPurchaseStatuses(purchases, deliveredMap);

        if (fullyDeliveredIds.length > 0) {
          await queryRunner.manager.update(Purchase, fullyDeliveredIds, { status: PURCHASE_STATUS.DELIVERED });
        }
        if (partialIds.length > 0) {
          await queryRunner.manager.update(Purchase, partialIds, { status: PURCHASE_STATUS.PARTIALLY_DELIVERED });
        }
        if (createdIds && createdIds.length > 0) {
          await queryRunner.manager.update(Purchase, createdIds, { status: PURCHASE_STATUS.CREATED });
        }
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateDelivery(idDelivery: string, dto: CreateDeliveryDto): Promise<{ idDelivery: string; ref: string }> {
    if (!dto.idPurchases || dto.idPurchases.length === 0) {
      throw new BadRequestError("Au moins une commande est requise.");
    }
    if (!dto.lines || dto.lines.length === 0) {
      throw new BadRequestError("Au moins une ligne de livraison est requise.");
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const delivery = await queryRunner.manager.getRepository(ProductDelivery).findOne({
        where: { idDelivery },
        relations: { purchaseDeliveries: true }
      });

      if (!delivery) throw new NotFoundError("Livraison introuvable.");
      if (delivery.status === DELIVERY_STATUS.VALIDATED) throw new BadRequestError("Impossible de modifier une livraison validée.");

      const oldPurchaseIds = delivery.purchaseDeliveries?.map(pd => pd.idPurchase) || [];
      const newPurchaseIds = dto.idPurchases;
      const allAffectedPurchaseIds = Array.from(new Set([...oldPurchaseIds, ...newPurchaseIds]));

      // 1 - Validate new purchases
      const purchases = await queryRunner.manager
        .createQueryBuilder(Purchase, "p")
        .leftJoinAndSelect("p.details", "detail")
        .where("p.idPurchase IN (:...ids)", { ids: allAffectedPurchaseIds })
        .getMany();

      const detailBySuppliedItem = deliveryHelper.indexPurchaseDetails(purchases);
      const totalDelivery = deliveryHelper.calculateTotalDelivery(dto.lines, detailBySuppliedItem);

      // 2 - Delete old details and links
      await queryRunner.manager.delete(DeliveryDetail, { idDelivery });
      await queryRunner.manager.delete(PurchaseDelivery, { idDelivery });

      // 3 - Update delivery total
      delivery.totalAmount = totalDelivery;
      await queryRunner.manager.save(ProductDelivery, delivery);

      // 4 - Insert new details
      const detailsToInsert = deliveryHelper.buildDetailsToInsert(idDelivery, dto.lines, detailBySuppliedItem);
      if (detailsToInsert.length > 0) {
        await queryRunner.manager
          .createQueryBuilder()
          .insert()
          .into(DeliveryDetail)
          .values(detailsToInsert)
          .execute();
      }

      // 5 - Insert new links
      const purchaseDeliveriesToInsert = newPurchaseIds.map((idPurchase) => ({
        idPurchase,
        idDelivery,
      }));
      if (purchaseDeliveriesToInsert.length > 0) {
        await queryRunner.manager
          .createQueryBuilder()
          .insert()
          .into(PurchaseDelivery)
          .values(purchaseDeliveriesToInsert)
          .execute();
      }

      // 6 - Recalculate statuses for all affected purchases
      if (allAffectedPurchaseIds.length > 0) {
        const deliveredRows = await queryRunner.manager.query(
          `SELECT pd.id_purchase, dd.id_supplied_item, COALESCE(SUM(dd.quantity), 0) AS delivered_qty
           FROM purchase_delivery pd
           JOIN delivery_details dd ON dd.id_delivery = pd.id_delivery
           WHERE pd.id_purchase = ANY($1)
           GROUP BY pd.id_purchase, dd.id_supplied_item`,
          [allAffectedPurchaseIds]
        ) as { id_purchase: string; id_supplied_item: string; delivered_qty: string }[];

        const deliveredMap = deliveryHelper.buildDeliveredMap(deliveredRows);
        const { fullyDeliveredIds, partialIds, createdIds } = deliveryHelper.determineNewPurchaseStatuses(purchases, deliveredMap);

        if (fullyDeliveredIds.length > 0) {
          await queryRunner.manager.update(Purchase, fullyDeliveredIds, { status: PURCHASE_STATUS.DELIVERED });
        }
        if (partialIds.length > 0) {
          await queryRunner.manager.update(Purchase, partialIds, { status: PURCHASE_STATUS.PARTIALLY_DELIVERED });
        }
        if (createdIds && createdIds.length > 0) {
          await queryRunner.manager.update(Purchase, createdIds, { status: PURCHASE_STATUS.CREATED });
        }
      }

      await queryRunner.commitTransaction();
      return { idDelivery, ref: delivery.ref };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(options: {
    page?: number;
    limit?: number;
    status?: number;
    ref?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<Paginated<any>> {
    const pageNum = options.page ?? 1;
    const limitNum = options.limit ?? 10;
    const repository = AppDataSource.getRepository(ProductDelivery);

    const qb = repository
      .createQueryBuilder("delivery")
      .select([
        "delivery.idDelivery",
        "delivery.ref",
        "delivery.deliveryDate",
        "delivery.totalAmount",
        "delivery.status",
      ])
      .leftJoinAndSelect("delivery.purchaseDeliveries", "pd")
      .leftJoinAndSelect("pd.purchase", "purchase")
      .leftJoinAndSelect("purchase.supplier", "supplier")
      .orderBy("delivery.deliveryDate", "DESC")
      .skip((pageNum - 1) * limitNum)
      .take(limitNum);

    if (options.status !== undefined) {
      qb.andWhere("delivery.status = :status", { status: options.status });
    }
    if (options.ref) {
      qb.andWhere("delivery.ref ILIKE :ref", { ref: `%${options.ref}%` });
    }
    if (options.startDate) {
      qb.andWhere("delivery.deliveryDate >= :startDate", { startDate: options.startDate });
    }
    if (options.endDate) {
      qb.andWhere("delivery.deliveryDate <= :endDate", { endDate: options.endDate });
    }

    const [records, total] = await qb.getManyAndCount();

    const mappedRecords = records.map((record) => {
      // Find supplier from the first linked purchase if any
      const purchaseLink = record.purchaseDeliveries?.[0]?.purchase;
      return {
        idDelivery: record.idDelivery,
        ref: record.ref,
        deliveryDate: record.deliveryDate,
        totalAmount: record.totalAmount,
        status: getDeliveryStatusName(record.status),
        purchaseRef: purchaseLink?.ref,
        idSupplier: purchaseLink?.supplier?.idSupplier,
        supplierName: purchaseLink?.supplier?.name,
      };
    });

    return {
      records: mappedRecords,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  async getDeliveryDetails(idDelivery: string): Promise<any> {
    const delivery = await AppDataSource.getRepository(ProductDelivery)
      .createQueryBuilder("delivery")
      .leftJoinAndSelect("delivery.deliveryDetails", "detail")
      .leftJoinAndSelect("detail.suppliedItem", "si")
      .leftJoinAndSelect("si.item", "item")
      .leftJoinAndSelect("delivery.purchaseDeliveries", "pd")
      .leftJoinAndSelect("pd.purchase", "purchase")
      .leftJoinAndSelect("purchase.supplier", "supplier")
      .where("delivery.idDelivery = :idDelivery", { idDelivery })
      .getOne();

    if (!delivery) throw new NotFoundError("Livraison introuvable.");

    return {
      idDelivery: delivery.idDelivery,
      ref: delivery.ref,
      deliveryDate: delivery.deliveryDate,
      totalAmount: delivery.totalAmount,
      status: getDeliveryStatusName(delivery.status),
      purchases: (delivery.purchaseDeliveries ?? []).map(pd => ({
        idPurchase: pd.purchase?.idPurchase,
        ref: pd.purchase?.ref,
        idSupplier: pd.purchase?.supplier?.idSupplier,
        supplierName: pd.purchase?.supplier?.name,
      })),
      details: (delivery.deliveryDetails ?? []).map(d => ({
        idDetail: d.idDetail,
        idSuppliedItem: d.idSuppliedItem,
        quantity: d.quantity,
        unitPrice: d.unitPrice,
        totalAmount: d.totalAmount,
        itemLabel: d.suppliedItem?.item?.label,
      }))
    };
  }
}

export const deliveryService = new DeliveryService();
