import { Brackets } from "typeorm";
import AppDataSource from "../../../database/data-source";
import { Purchase } from "../../../database/Entities/Purchase";
import { ProductDelivery } from "../../../database/Entities/ProductDelivery";
import { SupplierBalance } from "../../../database/Entities/SupplierBalance";
import { SupplierPaymentAllocation } from "../../../database/Entities/SupplierPaymentAllocation";
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
import { calculateNewCMP } from "../../items/utils/item.utils";
import { recipeService } from "../../recipes/services/recipe.service";

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
        "p.lifecycleStatus",
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
      .andWhere("p.lifecycleStatus != -3")
      .andWhere(new Brackets((qb) => {
        qb.where("p.status IN (:...statuses)", {
          statuses: [PURCHASE_STATUS.CREATED, PURCHASE_STATUS.PARTIALLY_DELIVERED],
        });
        if (excludeDeliveryId) {
          qb.orWhere(
            "p.idPurchase IN (SELECT pd.id_purchase FROM purchase_delivery pd WHERE pd.id_delivery = :excludeDeliveryId)",
            { excludeDeliveryId }
          );
        }
      }))
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
      lifecycleStatus: p.lifecycleStatus,
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
    this.validateCreateDeliveryDto(dto);

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const purchases = await this.loadPurchasesForDelivery(queryRunner, dto.idPurchases);
      const detailBySuppliedItem = deliveryHelper.indexPurchaseDetails(purchases);
      const totalDelivery = deliveryHelper.calculateTotalDelivery(dto.lines, detailBySuppliedItem);

      const savedDelivery = await this.saveProductDelivery(queryRunner, totalDelivery);

      await this.insertDeliveryDetails(queryRunner, savedDelivery.idDelivery, dto.lines, detailBySuppliedItem);
      await this.insertPurchaseDeliveries(queryRunner, savedDelivery.idDelivery, dto.idPurchases);

      const deliveredMap = await this.getDeliveredQuantitiesForPurchases(queryRunner, dto.idPurchases);
      await this.updatePurchasesStatuses(queryRunner, purchases, deliveredMap);

      await queryRunner.commitTransaction();
      recipeService.recalculateAllActiveCosts().catch(console.error);
      return { idDelivery: savedDelivery.idDelivery, ref: savedDelivery.ref };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // --- Helpers for createDelivery ---

  private validateCreateDeliveryDto(dto: CreateDeliveryDto): void {
    if (!dto.idPurchases || dto.idPurchases.length === 0) {
      throw new BadRequestError("Au moins une commande est requise.");
    }
    if (!dto.lines || dto.lines.length === 0) {
      throw new BadRequestError("Au moins une ligne de livraison est requise.");
    }
  }

  private async loadPurchasesForDelivery(queryRunner: any, idPurchases: string[], excludeDeliveryId?: string): Promise<Purchase[]> {
    const purchases = await queryRunner.manager
      .createQueryBuilder(Purchase, "p")
      .leftJoinAndSelect("p.details", "detail")
      .where("p.idPurchase IN (:...ids)", { ids: idPurchases })
      .getMany();

    if (purchases.length !== idPurchases.length) {
      throw new NotFoundError("Une ou plusieurs commandes introuvables.");
    }

    for (const purchase of purchases) {
      if (purchase.lifecycleStatus === 5) {
        throw new BadRequestError(`La commande ${purchase.ref} n'est pas encore validée (elle est en brouillon) et ne peut pas être réceptionnée.`);
      } else if (purchase.lifecycleStatus === -3) {
        throw new BadRequestError(`La commande ${purchase.ref} a été annulée et ne peut plus être réceptionnée.`);
      } else if (purchase.lifecycleStatus !== 0) {
        throw new BadRequestError(`La commande ${purchase.ref} ne peut pas être réceptionnée (statut invalide).`);
      }
    }

    // Ensure no open delivery already exists for any of the selected purchases
    for (const purchase of purchases) {
      const query = queryRunner.manager
        .createQueryBuilder(PurchaseDelivery, "pd")
        .innerJoin("pd.productDelivery", "delivery")
        .where("pd.idPurchase = :id", { id: purchase.idPurchase })
        .andWhere("delivery.status = :status", { status: DELIVERY_STATUS.OPEN });

      if (excludeDeliveryId) {
        query.andWhere("delivery.idDelivery != :excludeDeliveryId", { excludeDeliveryId });
      }

      const openCount = await query.getCount();
      if (openCount > 0) {
        throw new BadRequestError(`Une livraison en cours existe déjà pour la commande ${purchase.ref}, vous devez d'abord la validez .`);
      }
    }

    return purchases;
  }

  private async saveProductDelivery(queryRunner: any, totalDelivery: number): Promise<ProductDelivery> {
    const delivery = new ProductDelivery();
    delivery.deliveryDate = new Date();
    delivery.totalAmount = totalDelivery;
    delivery.status = DELIVERY_STATUS.OPEN;
    return await queryRunner.manager.save(ProductDelivery, delivery);
  }

  private async insertDeliveryDetails(queryRunner: any, idDelivery: string, lines: any[], detailBySuppliedItem: Map<string, any>): Promise<void> {
    const detailsToInsert = deliveryHelper.buildDetailsToInsert(idDelivery, lines, detailBySuppliedItem);
    if (detailsToInsert.length > 0) {
      await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(DeliveryDetail)
        .values(detailsToInsert)
        .execute();
    }
  }

  private async insertPurchaseDeliveries(queryRunner: any, idDelivery: string, idPurchases: string[]): Promise<void> {
    const purchaseDeliveriesToInsert = idPurchases.map((idPurchase) => ({ idPurchase, idDelivery }));
    if (purchaseDeliveriesToInsert.length > 0) {
      await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(PurchaseDelivery)
        .values(purchaseDeliveriesToInsert)
        .execute();
    }
  }

  private async getDeliveredQuantitiesForPurchases(queryRunner: any, idPurchases: string[]): Promise<Map<string, number>> {
    const deliveredRows = await queryRunner.manager.query(
      `SELECT pd.id_purchase, dd.id_supplied_item, COALESCE(SUM(dd.quantity), 0) AS delivered_qty
       FROM purchase_delivery pd
       JOIN delivery_details dd ON dd.id_delivery = pd.id_delivery
       WHERE pd.id_purchase = ANY($1)
       GROUP BY pd.id_purchase, dd.id_supplied_item`,
      [idPurchases]
    ) as { id_purchase: string; id_supplied_item: string; delivered_qty: string }[];
    return deliveryHelper.buildDeliveredMap(deliveredRows);
  }

  private async updatePurchasesStatuses(queryRunner: any, purchases: Purchase[], deliveredMap: Map<string, number>): Promise<void> {
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

  private async getDeliveryForUpdate(queryRunner: any, idDelivery: string): Promise<ProductDelivery> {
    const delivery = await queryRunner.manager.getRepository(ProductDelivery).findOne({
      where: { idDelivery },
      relations: { purchaseDeliveries: true }
    });

    if (!delivery) throw new NotFoundError("Livraison introuvable.");
    if (delivery.status === DELIVERY_STATUS.VALIDATED) throw new BadRequestError("Impossible de modifier une livraison validée.");
    return delivery;
  }

  private async clearOldDeliveryData(queryRunner: any, idDelivery: string): Promise<void> {
    await queryRunner.manager.delete(DeliveryDetail, { idDelivery });
    await queryRunner.manager.delete(PurchaseDelivery, { idDelivery });
  }

  async validateDelivery(idDelivery: string, idOperator: string): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const delivery = await this.getDeliveryForValidation(queryRunner, idDelivery);

      await this.markDeliveryAsValidated(queryRunner, delivery);

      const { stockMovements, itemsArray } = this.processDeliveryDetails(delivery, idOperator);

      await this.saveStockUpdates(queryRunner, stockMovements, itemsArray);

      // Initialiser balance_due et mettre à jour le debit fournisseur
      const totalDelivery = Number(delivery.totalAmount ?? 0);
      delivery.balanceDue = totalDelivery;
      await queryRunner.manager.save(ProductDelivery, delivery);

      const idSupplier = delivery.purchaseDeliveries?.[0]?.purchase?.idSupplier;
      if (idSupplier) {
        let balance = await queryRunner.manager.findOne(SupplierBalance, { where: { idSupplier } });
        if (!balance) {
          balance = queryRunner.manager.create(SupplierBalance, { idSupplier, credit: 0, debit: 0 });
        }
        balance.debit = Number(balance.debit) + totalDelivery;
        await queryRunner.manager.save(SupplierBalance, balance);
      }

      await queryRunner.commitTransaction();
      recipeService.recalculateAllActiveCosts().catch(console.error);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // --- Helpers for validateDelivery ---

  private async getDeliveryForValidation(queryRunner: any, idDelivery: string): Promise<ProductDelivery> {
    const delivery = await queryRunner.manager.getRepository(ProductDelivery).findOne({
      where: { idDelivery },
      relations: {
        deliveryDetails: {
          suppliedItem: {
            item: true
          }
        },
        purchaseDeliveries: { purchase: true }
      }
    });

    if (!delivery) throw new NotFoundError("Livraison introuvable.");
    if (delivery.status === DELIVERY_STATUS.VALIDATED) throw new BadRequestError("Livraison déjà validée.");
    return delivery;
  }

  private async markDeliveryAsValidated(queryRunner: any, delivery: ProductDelivery): Promise<void> {
    delivery.status = DELIVERY_STATUS.VALIDATED;
    await queryRunner.manager.save(ProductDelivery, delivery);
  }

  private processDeliveryDetails(delivery: ProductDelivery, idOperator: string) {
    const itemsToUpdate = new Map<string, Item>();
    const stockMovements: StockMovement[] = [];

    if (delivery.deliveryDetails) {
      for (let i = 0; i < delivery.deliveryDetails.length; i++) {
        const detail = delivery.deliveryDetails[i];
        if (!detail || !detail.suppliedItem || !detail.suppliedItem.item) continue;

        const item = detail.suppliedItem.item;

        const movement = new StockMovement();
        movement.idItem = item.idItem;
        movement.movementDate = new Date();
        movement.quantity = detail.quantity;
        movement.movementType = STOCK_MOVEMENT_TYPE.RECEPTION_FOURNISSEUR;
        movement.idOperator = idOperator;

        stockMovements.push(movement);

        // Update item quantity and CMP
        if (!itemsToUpdate.has(item.idItem)) {
          itemsToUpdate.set(item.idItem, item);
        }
        const mappedItem = itemsToUpdate.get(item.idItem)!;

        const currentStock = Number(mappedItem.quantity ?? 0);
        const currentCMP = mappedItem.weightedAverageCost !== null && mappedItem.weightedAverageCost !== undefined 
          ? Number(mappedItem.weightedAverageCost) 
          : null;
        const receivedQty = Number(detail.quantity ?? 0);
        const newPrice = Number(detail.unitPrice ?? 0);

        // Calculate and update CMP if the incoming price is different
        if (newPrice !== currentCMP) {
          mappedItem.weightedAverageCost = calculateNewCMP(currentStock, currentCMP, receivedQty, newPrice);
        }

        mappedItem.quantity = currentStock + receivedQty;
      }
    }

    return { stockMovements, itemsArray: Array.from(itemsToUpdate.values()) };
  }

  private async saveStockUpdates(queryRunner: any, stockMovements: StockMovement[], itemsArray: Item[]): Promise<void> {
    if (stockMovements.length > 0) {
      await queryRunner.manager.save(StockMovement, stockMovements);
    }
    if (itemsArray.length > 0) {
      await queryRunner.manager.save(Item, itemsArray);
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
    this.validateCreateDeliveryDto(dto);

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const delivery = await this.getDeliveryForUpdate(queryRunner, idDelivery);

      const oldPurchaseIds = delivery.purchaseDeliveries?.map(pd => pd.idPurchase) || [];
      const newPurchaseIds = dto.idPurchases;
      const allAffectedPurchaseIds = Array.from(new Set([...oldPurchaseIds, ...newPurchaseIds]));

      const purchases = await this.loadPurchasesForDelivery(queryRunner, allAffectedPurchaseIds, idDelivery);
      const detailBySuppliedItem = deliveryHelper.indexPurchaseDetails(purchases);
      const totalDelivery = deliveryHelper.calculateTotalDelivery(dto.lines, detailBySuppliedItem);

      await this.clearOldDeliveryData(queryRunner, idDelivery);

      delivery.totalAmount = totalDelivery;
      await queryRunner.manager.save(ProductDelivery, delivery);

      await this.insertDeliveryDetails(queryRunner, idDelivery, dto.lines, detailBySuppliedItem);
      await this.insertPurchaseDeliveries(queryRunner, idDelivery, newPurchaseIds);

      if (allAffectedPurchaseIds.length > 0) {
        const deliveredMap = await this.getDeliveredQuantitiesForPurchases(queryRunner, allAffectedPurchaseIds);
        await this.updatePurchasesStatuses(queryRunner, purchases, deliveredMap);
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
    idPurchase?: string;
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
        "delivery.balanceDue",
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
    if (options.idPurchase) {
      qb.andWhere("pd.idPurchase = :idPurchase", { idPurchase: options.idPurchase });
    }

    const [records, total] = await qb.getManyAndCount();

    const mappedRecords = records.map((record) => {
      // Find supplier from the first linked purchase if any
      const purchaseLink = record.purchaseDeliveries?.[0]?.purchase;
      
      const balanceDue = Number(record.balanceDue ?? 0);

      return {
        idDelivery: record.idDelivery,
        ref: record.ref,
        deliveryDate: record.deliveryDate,
        totalAmount: record.totalAmount,
        balanceDue: balanceDue,
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

    const balanceDue = Number(delivery.balanceDue ?? 0);

    return {
      idDelivery: delivery.idDelivery,
      ref: delivery.ref,
      deliveryDate: delivery.deliveryDate,
      totalAmount: delivery.totalAmount,
      balanceDue: balanceDue,
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

