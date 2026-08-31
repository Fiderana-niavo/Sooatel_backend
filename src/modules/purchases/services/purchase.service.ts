import AppDataSource from "../../../database/data-source";
import { Purchase } from "../../../database/Entities/Purchase";
import { PurchaseDetail } from "../../../database/Entities/PurchaseDetail";
import { SuppliedItem } from "../../../database/Entities/SuppliedItem";
import { PURCHASE_STATUS } from "../constants/purchase.constants";
import { PurchaseDto, PurchaseDetailDto } from "../type/purchase.type";
import { NotFoundError, BadRequestError } from "../../../shared/errors/AppError";
import { Paginated } from "../../../shared/types/Paginated";
import { getPurchaseStatusName } from "../constants/purchase.constants";
import { getDeliveryStatusName } from "../../delivery/constants/delivery.constants";
import { ProductDelivery } from "../../../database/Entities/ProductDelivery";
import { PurchaseDelivery } from "../../../database/Entities/PurchaseDelivery";
import { DeliveryDetail } from "../../../database/Entities/DeliveryDetail";
import { SupplierPaymentAllocation } from "../../../database/Entities/SupplierPaymentAllocation";
import { SupplierBalance } from "../../../database/Entities/SupplierBalance";

export class PurchaseService {
  async createPurchase(dto: PurchaseDto, userId: string): Promise<any> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let purchase = this.buildNewPurchase(dto, userId);
      purchase = await queryRunner.manager.save(Purchase, purchase);

      const { details, totalAmount } = await this.prepareNewPurchaseDetails(queryRunner, purchase.idPurchase, dto);

      await this.insertPurchaseDetails(queryRunner, details);

      purchase.totalAmount = totalAmount;
      await queryRunner.manager.save(Purchase, purchase);

      await queryRunner.commitTransaction();

      return {
        ...purchase,
        status: getPurchaseStatusName(purchase.status)
      } as any;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updatePurchase(idPurchase: string, dto: PurchaseDto, userId: string): Promise<any> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const purchase = await this.getPurchaseForUpdate(queryRunner, idPurchase);

      this.validatePurchaseCanBeUpdated(purchase);

      await this.validateNoOpenDelivery(queryRunner, idPurchase);

      const deliveredQuantities = await this.getDeliveredQuantities(queryRunner, purchase);

      this.validateSupplierChange(purchase, dto, deliveredQuantities);

      const preparedDetails = await this.preparePurchaseDetails(queryRunner, purchase, dto, deliveredQuantities);

      await this.replacePurchaseDetails(queryRunner, purchase.idPurchase, preparedDetails.details);

      this.updatePurchaseData(purchase, dto, preparedDetails.totalAmount, userId);

      // Prevent TypeORM from syncing the old details relation and deleting the newly inserted details
      delete (purchase as any).details;

      await queryRunner.manager.save(Purchase, purchase);
      await queryRunner.commitTransaction();

      return {
        ...purchase,
        status: getPurchaseStatusName(purchase.status)
      } as any;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // --- Helpers for PurchaseService ---

  private buildNewPurchase(dto: PurchaseDto, userId: string): Purchase {
    const purchase = new Purchase();
    purchase.purchaseDate = dto.purchaseDate ? new Date(dto.purchaseDate) : new Date();
    purchase.status = PURCHASE_STATUS.CREATED;
    purchase.idSupplier = dto.idSupplier;
    purchase.idPurchaser = dto.idPurchaser || userId;
    return purchase;
  }

  private async prepareNewPurchaseDetails(queryRunner: any, idPurchase: string, dto: PurchaseDto) {
    let calculatedTotal = 0;
    const detailsToInsert = [];

    if (dto.details && dto.details.length > 0) {
      for (const detailDto of dto.details) {
        if (detailDto.quantity < 1) throw new BadRequestError(`La quantitÃƒÂ© doit ÃƒÂªtre au moins 1.`);
        if (detailDto.unitPrice < 0) throw new BadRequestError(`Le prix unitaire ne peut pas ÃƒÂªtre nÃƒÂ©gatif.`);

        const suppliedItem = await queryRunner.manager.findOne(SuppliedItem, { where: { idSuppliedItem: detailDto.idSuppliedItem } });
        if (!suppliedItem) throw new NotFoundError(`Article fournisseur ${detailDto.idSuppliedItem} introuvable`);

        const lineTotal = detailDto.quantity * detailDto.unitPrice;
        calculatedTotal += lineTotal;
        detailsToInsert.push({
          idPurchase: idPurchase,
          idSuppliedItem: detailDto.idSuppliedItem,
          quantity: detailDto.quantity,
          unitPrice: detailDto.unitPrice,
          totalAmount: lineTotal
        });
      }
    }
    return { details: detailsToInsert, totalAmount: calculatedTotal };
  }

  private async insertPurchaseDetails(queryRunner: any, detailsToInsert: any[]): Promise<void> {
    if (detailsToInsert.length > 0) {
      await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(PurchaseDetail)
        .values(detailsToInsert)
        .execute();
    }
  }

  private async getPurchaseForUpdate(queryRunner: any, idPurchase: string): Promise<Purchase> {
    const purchase = await queryRunner.manager.findOne(Purchase, {
      where: { idPurchase },
      relations: { details: true }
    });
    if (!purchase) throw new NotFoundError("Commande introuvable");
    return purchase;
  }

  private validatePurchaseCanBeUpdated(purchase: Purchase): void {
    if (purchase.lifecycleStatus !== 5 && purchase.lifecycleStatus !== 0) {
      throw new BadRequestError("Cette commande ne peut plus ÃƒÂªtre modifiÃƒÂ©e (statut invalide).");
    }
  }

  private async validateNoOpenDelivery(queryRunner: any, idPurchase: string): Promise<void> {
    const openDeliveriesCount = await queryRunner.manager
      .createQueryBuilder(PurchaseDelivery, "pd")
      .innerJoin("pd.productDelivery", "delivery")
      .where("pd.id_purchase = :idPurchase", { idPurchase })
      .andWhere("delivery.status = 5") // Open delivery
      .getCount();

    if (openDeliveriesCount > 0) {
      throw new BadRequestError("Impossible de modifier une commande avec une livraison en cours (OUVERTE).");
    }
  }

  private async getDeliveredQuantities(queryRunner: any, purchase: Purchase): Promise<Map<string, number>> {
    const deliveredQuantities = new Map<string, number>();

    if (purchase.status === PURCHASE_STATUS.PARTIALLY_DELIVERED || purchase.status === PURCHASE_STATUS.DELIVERED) {
      const details = await queryRunner.manager
        .createQueryBuilder(DeliveryDetail, "dd")
        .innerJoin("dd.productDelivery", "delivery")
        .innerJoin("delivery.purchaseDeliveries", "pd")
        .where("pd.id_purchase = :idPurchase", { idPurchase: purchase.idPurchase })
        .andWhere("delivery.status = 0") // Confirmed delivery
        .getMany();

      for (const d of details) {
        const current = deliveredQuantities.get(d.idSuppliedItem) || 0;
        deliveredQuantities.set(d.idSuppliedItem, current + Number(d.quantity));
      }
    }
    return deliveredQuantities;
  }

  private validateSupplierChange(purchase: Purchase, dto: PurchaseDto, deliveredQuantities: Map<string, number>): void {
    if (deliveredQuantities.size > 0 && purchase.idSupplier !== dto.idSupplier) {
      throw new BadRequestError("Impossible de changer le fournisseur d'une commande partiellement livrÃƒÂ©e.");
    }
  }

  private async validateSuppliedItemQuantity(queryRunner: any, detailDto: PurchaseDetailDto, deliveredQuantities: Map<string, number>): Promise<void> {
    const suppliedItem = await queryRunner.manager.findOne(SuppliedItem, {
      where: { idSuppliedItem: detailDto.idSuppliedItem },
      relations: { item: true }
    });
    if (!suppliedItem) throw new NotFoundError(`Article fournisseur ${detailDto.idSuppliedItem} introuvable`);

    const deliveredQty = deliveredQuantities.get(detailDto.idSuppliedItem) || 0;
    if (detailDto.quantity < deliveredQty) {
      const itemName = suppliedItem.item?.label || detailDto.idSuppliedItem;
      throw new BadRequestError(`La quantitÃƒÂ© de l'article "${itemName}" ne peut pas ÃƒÂªtre infÃƒÂ©rieure ÃƒÂ  la quantitÃƒÂ© dÃƒÂ©jÃƒÂ  livrÃƒÂ©e (${deliveredQty}).`);
    }
  }

  private async preparePurchaseDetails(queryRunner: any, purchase: Purchase, dto: PurchaseDto, deliveredQuantities: Map<string, number>) {
    let calculatedTotal = 0;
    const detailsToInsert = [];
    const newDetailIds = dto.details ? dto.details.map(d => d.idSuppliedItem) : [];

    if (dto.details && dto.details.length > 0) {
      for (const detailDto of dto.details) {
        if (detailDto.quantity < 1) throw new BadRequestError("La quantitÃƒÂ© doit ÃƒÂªtre au moins 1.");
        if (detailDto.unitPrice < 0) throw new BadRequestError("Le prix unitaire ne peut pas ÃƒÂªtre nÃƒÂ©gatif.");

        await this.validateSuppliedItemQuantity(queryRunner, detailDto, deliveredQuantities);

        const lineTotal = detailDto.quantity * detailDto.unitPrice;
        calculatedTotal += lineTotal;
        detailsToInsert.push({
          idPurchase: purchase.idPurchase,
          idSuppliedItem: detailDto.idSuppliedItem,
          quantity: detailDto.quantity,
          unitPrice: detailDto.unitPrice,
          totalAmount: lineTotal
        });
      }
    }

    for (const oldDetail of purchase.details) {
      if (!newDetailIds.includes(oldDetail.idSuppliedItem)) {
        const deliveredQty = deliveredQuantities.get(oldDetail.idSuppliedItem) || 0;
        if (deliveredQty > 0) {
          throw new BadRequestError(`Impossible de supprimer l'article ${oldDetail.idSuppliedItem} car ${deliveredQty} unitÃƒÂ©s ont dÃƒÂ©jÃƒÂ  ÃƒÂ©tÃƒÂ© livrÃƒÂ©es.`);
        }
      }
    }

    return { details: detailsToInsert, totalAmount: calculatedTotal };
  }

  private async replacePurchaseDetails(queryRunner: any, idPurchase: string, detailsToInsert: any[]): Promise<void> {
    await queryRunner.manager.delete(PurchaseDetail, { idPurchase });
    if (detailsToInsert.length > 0) {
      await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(PurchaseDetail)
        .values(detailsToInsert)
        .execute();
    }
  }

  private updatePurchaseData(purchase: Purchase, dto: PurchaseDto, calculatedTotal: number, userId: string): void {
    purchase.purchaseDate = dto.purchaseDate ? new Date(dto.purchaseDate) : purchase.purchaseDate;
    purchase.idSupplier = dto.idSupplier;
    purchase.idPurchaser = dto.idPurchaser || purchase.idPurchaser || userId;
    purchase.totalAmount = calculatedTotal;
    
  }

  async confirmPurchase(idPurchase: string, userId: string): Promise<Purchase> {
    const purchase = await Purchase.findOne({ where: { idPurchase } });
    if (!purchase) throw new NotFoundError("Commande introuvable");
    if (purchase.lifecycleStatus !== 5) { // 5 = Ouvert
      throw new BadRequestError("Seule une commande au statut 'Ouvert' peut ÃƒÂªtre confirmÃƒÂ©e.");
    }

    purchase.lifecycleStatus = 0; // 0 = ConfirmÃƒÂ©
    await purchase.save();
    return {
      ...purchase,
      status: getPurchaseStatusName(purchase.status)
    } as any;
  }

  async cancelPurchase(idPurchase: string, userId: string, options?: { forceAction?: "delete" | "confirm" }): Promise<Purchase> {
    const purchase = await Purchase.findOne({ where: { idPurchase } });
    if (!purchase) throw new NotFoundError("Commande introuvable");
    if (purchase.lifecycleStatus === -3) { // -3 = AnnulÃƒÂ©
      throw new BadRequestError("Cette commande est dÃƒÂ©jÃƒÂ  annulÃƒÂ©e.");
    }

    if (purchase.status === PURCHASE_STATUS.DELIVERED) { // 0 = LivrÃƒÂ©
      throw new BadRequestError("Impossible d'annuler une commande dÃƒÂ©jÃƒÂ  entiÃƒÂ¨rement livrÃƒÂ©e.");
    }

    // Handle open deliveries
    const openDelivery = await PurchaseDelivery.createQueryBuilder("pd")
      .innerJoinAndSelect("pd.productDelivery", "delivery")
      .where("pd.id_purchase = :idPurchase", { idPurchase })
      .andWhere("delivery.status = 5") // Open delivery
      .getOne();

    if (openDelivery && openDelivery.productDelivery) {
      const deliveryId = openDelivery.productDelivery.idDelivery;
      if (!options?.forceAction) {
        throw new BadRequestError("livraison non validÃƒÂ©e");
      }
      
      const { DeliveryService } = require("../../delivery/services/delivery.service");
      const deliveryService = new DeliveryService();
      
      if (options.forceAction === "delete") {
        await deliveryService.deleteDelivery(deliveryId);
      } else if (options.forceAction === "confirm") {
        await deliveryService.validateDelivery(deliveryId, userId);
      }
      
      // Reload purchase as status might have changed after delivery confirmation
      await purchase.reload();
    }

    if (purchase.status === PURCHASE_STATUS.PARTIALLY_DELIVERED) {
      purchase.status = PURCHASE_STATUS.DELIVERED;
    }

    purchase.lifecycleStatus = -3; // AnnulÃƒÂ©
    await purchase.save();

    // Check if any advance payments were made Ã¢â‚¬â€  create supplier credit if excess
    await this.handleCancellationCredit(idPurchase, purchase.idSupplier, userId);

    return {
      ...purchase,
      status: getPurchaseStatusName(purchase.status)
    } as any;
  }

  private async handleCancellationCredit(idPurchase: string, idSupplier: string, _idEmployee: string): Promise<void> {
    // Calculer le total des acomptes versés depuis les allocations DEPOSIT
    const result = await AppDataSource.getRepository(SupplierPaymentAllocation)
      .createQueryBuilder("spa")
      .select("COALESCE(SUM(spa.amount), 0)", "total")
      .where("spa.id_purchase = :idPurchase", { idPurchase })
      .andWhere("spa.allocation_type = 'DEPOSIT'")
      .getRawOne() as { total: string };

    const totalAdvances = Number(result.total);
    if (totalAdvances <= 0) return;


    // Sum of validated deliveries for this purchase
    const deliveriesResult = await PurchaseDelivery
      .createQueryBuilder("pd")
      .innerJoin("pd.productDelivery", "d")
      .select("COALESCE(SUM(d.total_amount), 0)", "total")
      .where("pd.id_purchase = :idPurchase", { idPurchase })
      .andWhere("d.status = 0") // Validated
      .getRawOne() as { total: string };

    const totalDelivered = Number(deliveriesResult.total);
    const excess = totalAdvances - totalDelivered;

    if (excess > 0) {
      let row = await SupplierBalance.findOne({ where: { idSupplier } });
      if (!row) {
        row = new SupplierBalance();
        row.idSupplier = idSupplier;
        row.credit = 0;
        row.debit = 0;
      }
      row.credit = Number(row.credit) + excess;
      await row.save();
    }

  }
  async findAll(options: {
    page?: number;
    limit?: number;
    status?: number;
    lifecycleStatus?: number;
    idSupplier?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<Paginated<any>> {
    const pageNum = options.page ?? 1;
    const limitNum = options.limit ?? 10;
    const repository = AppDataSource.getRepository(Purchase);

    const qb = repository
      .createQueryBuilder("purchase")
      .select([
        "purchase.idPurchase",
        "purchase.ref",
        "purchase.purchaseDate",
        "purchase.totalAmount",
        "purchase.status",
        "purchase.lifecycleStatus",
        "purchase.idSupplier",
        "purchase.idPurchaser"
      ])
      .leftJoin("purchase.supplier", "supplier")
      .addSelect(["supplier.idSupplier", "supplier.name"])
      .orderBy("purchase.purchaseDate", "DESC")
      .skip((pageNum - 1) * limitNum)
      .take(limitNum);

    if (options.status !== undefined) {
      qb.andWhere("purchase.status = :status", { status: options.status });
    }

    if (options.lifecycleStatus !== undefined) {
      qb.andWhere("purchase.lifecycleStatus = :lifecycleStatus", { lifecycleStatus: options.lifecycleStatus });
    } else {
      // By default, exclude canceled purchases from the normal list
      qb.andWhere("purchase.lifecycleStatus != -3");
    }

    if (options.idSupplier) {
      qb.andWhere("purchase.idSupplier = :idSupplier", { idSupplier: options.idSupplier });
    }

    if (options.startDate) {
      qb.andWhere("purchase.purchaseDate >= :startDate", { startDate: options.startDate });
    }

    if (options.endDate) {
      qb.andWhere("purchase.purchaseDate <= :endDate", { endDate: options.endDate });
    }

    const [records, total] = await qb.getManyAndCount();

    const mappedRecords = records.map((record) => ({
      ...record,
      status: record.lifecycleStatus === -3 ? "AnnulÃƒÂ©" : getPurchaseStatusName(record.status),
      lifecycleStatus: record.lifecycleStatus ?? 5
    }));

    return {
      records: mappedRecords,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    };
  }

  async getPurchaseById(idPurchase: string): Promise<any | null> {
    const purchase = await Purchase.findOne({
      where: { idPurchase },
      select: {
        idPurchase: true,
        ref: true,
        purchaseDate: true,
        totalAmount: true,

        status: true,
        lifecycleStatus: true,
        idSupplier: true,
        idPurchaser: true,
        supplier: {
          idSupplier: true,
          name: true
        },
        purchaser: {
          idEmployee: true,
          name: true,
          lastname: true
        }
      },
      relations: {
        supplier: true,
        purchaser: true,
      }
    });

    if (!purchase) return null;

    const result = await AppDataSource.getRepository(SupplierPaymentAllocation)
      .createQueryBuilder("spa")
      .select("COALESCE(SUM(spa.amount), 0)", "total")
      .where("spa.id_purchase = :idPurchase", { idPurchase })
      .andWhere("spa.allocation_type = 'DEPOSIT'")
      .getRawOne() as { total: string };
    const advanceAmount = Number(result.total);

    return {
      ...purchase,
      advanceAmount,
      status: purchase.lifecycleStatus === -3 ? "AnnulÃƒÂ©" : getPurchaseStatusName(purchase.status)
    };
  }

  async getPurchaseDetails(idPurchase: string): Promise<PurchaseDetail[]> {
    return PurchaseDetail.find({
      where: { idPurchase },
      select: {
        idPurchaseDetail: true,
        idPurchase: true,
        idSuppliedItem: true,
        quantity: true,
        unitPrice: true,
        totalAmount: true,
        suppliedItem: {
          idSuppliedItem: true,
          item: {
            idItem: true,
            label: true,
            ref: true
          },
          supplierProduct: {
            idSupplierProduct: true,
            name: true,
            actualPrice: true
          }
        }
      },
      relations: {
        suppliedItem: {
          item: true,
          supplierProduct: true
        }
      }
    });
  }

  async getPurchaseDeliveries(idPurchase: string): Promise<any[]> {
    // 1. Get supplied items for this purchase
    const purchaseDetails = await PurchaseDetail.find({
      where: { idPurchase },
      select: { idSuppliedItem: true }
    });
    const suppliedItemIds = purchaseDetails.map((d) => d.idSuppliedItem);

    if (suppliedItemIds.length === 0) return [];

    // 2. Get deliveries linked to this purchase
    const deliveries = await AppDataSource.getRepository(ProductDelivery)
      .createQueryBuilder("delivery")
      .innerJoin("delivery.purchaseDeliveries", "pd")
      .leftJoinAndSelect("delivery.deliveryDetails", "detail")
      .leftJoinAndSelect("detail.suppliedItem", "si")
      .leftJoinAndSelect("si.item", "item")
      .where("pd.idPurchase = :idPurchase", { idPurchase })
      .orderBy("delivery.deliveryDate", "DESC")
      .getMany();

    // 3. Filter deliveryDetails to only include items from this purchase
    return deliveries.map((delivery) => {
      const filteredDetails = delivery.deliveryDetails.filter((d) =>
        suppliedItemIds.includes(d.idSuppliedItem)
      );

      return {
        idDelivery: delivery.idDelivery,
        ref: delivery.ref,
        deliveryDate: delivery.deliveryDate,
        totalAmount: delivery.totalAmount, // Note: Global delivery amount
        status: getDeliveryStatusName(delivery.status),
        details: filteredDetails.map((d) => ({
          idDeliveryDetail: d.idDetail,
          idSuppliedItem: d.idSuppliedItem,
          quantity: d.quantity,
          unitPrice: d.unitPrice,
          totalAmount: d.totalAmount,
          itemLabel: d.suppliedItem?.item?.label,
          itemRef: d.suppliedItem?.item?.ref,
        })),
      };
    });
  }
}


