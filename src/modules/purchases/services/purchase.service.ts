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
import { SupplierPayment } from "../../../database/Entities/SupplierPayment";
import { CashJournal } from "../../../database/Entities/CashJournal";
import { PaymentMethodBalance } from "../../../database/Entities/PaymentMethodBalance";
import { createCashOutflow, getOrCreateCategory } from "../../sales/utils/sale-cash-movement.util";
import { IsNull } from "typeorm";
import { Supplier } from "../../../database/Entities/Supplier";
import { Employee } from "../../../database/Entities/Employee";
import { User } from "../../../database/Entities/User";
import { StockMovement } from "../../../database/Entities/StockMovement";
import { Item } from "../../../database/Entities/Item";
import {
  STOCK_MOVEMENT_TYPE,
  STOCK_MOVEMENT_STATUS,
  STOCK_MOVEMENT_DIRECTION,
} from "../../items/constants/stock.constants";
import { calculateNewCMP } from "../../items/utils/item.utils";
import { recipeService } from "../../recipes/services/recipe.service";
import { DELIVERY_STATUS } from "../../delivery/constants/delivery.constants";

export class PurchaseService {
  private async resolveEmployeeId(id: string): Promise<string> {
    if (!id) return id;
    const emp = await Employee.findOne({ where: { idEmployee: id } });
    if (emp) return id;
    const user = await User.findOne({ where: { idUser: id } });
    if (user && user.idEmployee) return user.idEmployee;
    return id;
  }

  async createPurchase(dto: PurchaseDto, userId: string): Promise<any> {
    const operatorId = await this.resolveEmployeeId(userId);
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let purchase = this.buildNewPurchase(dto, operatorId);
      purchase = await queryRunner.manager.save(Purchase, purchase);

      const { details, totalAmount } = await this.prepareNewPurchaseDetails(
        queryRunner,
        purchase.idPurchase,
        dto,
      );

      await this.insertPurchaseDetails(queryRunner, details);

      purchase.totalAmount = totalAmount;
      await queryRunner.manager.save(Purchase, purchase);

      if (dto.deliveryDone) {
        purchase.lifecycleStatus = 0; // Confirm purchase so delivery can be attached
        await queryRunner.manager.save(Purchase, purchase);

        // 1. Determine lines to deliver
        const linesToDeliver = (dto.deliveryLines && dto.deliveryLines.length > 0)
          ? dto.deliveryLines.map((l) => ({
              idSuppliedItem: l.idSuppliedItem,
              quantity: Number(l.quantity || 0),
              unitPrice: Number(l.unitPrice || 0),
            }))
          : (dto.details || []).map((d) => ({
              idSuppliedItem: d.idSuppliedItem,
              quantity: Number(d.quantity || 0),
              unitPrice: Number(d.unitPrice || 0),
            }));

        const validDeliveryLines = linesToDeliver.filter((l) => l.quantity > 0);
        if (validDeliveryLines.length === 0) {
          throw new BadRequestError(
            "Impossible d'effectuer une livraison directe sans aucun produit reçu. Veuillez saisir au moins une quantité reçue ou décocher 'Livraison déjà effectuée ?'."
          );
        }

        let totalDeliveryAmount = 0;
        for (const line of validDeliveryLines) {
          totalDeliveryAmount += Number(line.quantity) * Number(line.unitPrice);
        }

        // 2. Create ProductDelivery (status OPEN = 5, not validated yet, stock will be updated when user validates delivery)
        const delivery = new ProductDelivery();
        delivery.deliveryDate = new Date();
        delivery.totalAmount = totalDeliveryAmount;
        delivery.balanceDue = totalDeliveryAmount;
        delivery.status = DELIVERY_STATUS.OPEN; // 5 = Open delivery
        const savedDelivery = await queryRunner.manager.save(ProductDelivery, delivery);

        // 3. Link PurchaseDelivery
        const pdLink = new PurchaseDelivery();
        pdLink.idPurchase = purchase.idPurchase;
        pdLink.idDelivery = savedDelivery.idDelivery;
        await queryRunner.manager.save(PurchaseDelivery, pdLink);

        // 4. Insert DeliveryDetails
        const deliveryDetailsToInsert: any[] = [];
        for (const line of linesToDeliver) {
          if (line.quantity <= 0) continue;
          deliveryDetailsToInsert.push({
            idDelivery: savedDelivery.idDelivery,
            idSuppliedItem: line.idSuppliedItem,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            totalAmount: Number(line.quantity) * Number(line.unitPrice),
          });
        }

        if (deliveryDetailsToInsert.length > 0) {
          await queryRunner.manager
            .createQueryBuilder()
            .insert()
            .into(DeliveryDetail)
            .values(deliveryDetailsToInsert)
            .execute();
        }

        // 5. Update Purchase Status (DELIVERED or PARTIALLY_DELIVERED)
        const isFullyDelivered = (dto.details || []).every(d => {
          const delLine = linesToDeliver.find(l => l.idSuppliedItem === d.idSuppliedItem);
          return delLine && delLine.quantity >= d.quantity;
        });
        purchase.status = isFullyDelivered ? PURCHASE_STATUS.DELIVERED : PURCHASE_STATUS.PARTIALLY_DELIVERED;
        await queryRunner.manager.save(Purchase, purchase);

        // 6. Handle Payment allocated directly to the delivery
        if (dto.advanceAmount && dto.advanceAmount > 0 && dto.idPaymentMethod) {
          const supplier = await queryRunner.manager.findOne(Supplier, { where: { idSupplier: purchase.idSupplier } });

          const payment = queryRunner.manager.create(SupplierPayment, {
            idSupplier: purchase.idSupplier,
            idProcessedBy: operatorId,
            idPaymentMethod: dto.idPaymentMethod,
            amount: dto.advanceAmount,
            paymentDate: new Date(),
            notes: `Paiement pour la livraison de la commande ${purchase.ref || purchase.idPurchase}`,
          });
          await queryRunner.manager.save(SupplierPayment, payment);

          // Create Allocation linked to DELIVERY
          const allocation = queryRunner.manager.create(SupplierPaymentAllocation, {
            idSupplierPayment: payment.idSupplierPayment,
            allocationType: "DELIVERY",
            idDelivery: savedDelivery.idDelivery,
            amount: dto.advanceAmount,
          });
          await queryRunner.manager.save(SupplierPaymentAllocation, allocation);

          // Update delivery balanceDue
          savedDelivery.balanceDue = Math.max(0, savedDelivery.totalAmount - dto.advanceAmount);
          await queryRunner.manager.save(ProductDelivery, savedDelivery);

          // Cash outflow
          const activeJournal = await queryRunner.manager.findOne(CashJournal, {
            where: { journalClosing: IsNull() },
            order: { journalOpening: "DESC" },
          });

          if (!activeJournal) {
            throw new BadRequestError("Aucun journal de caisse actif trouvé pour le paiement.");
          }

          let pmb = await queryRunner.manager.findOne(PaymentMethodBalance, {
            where: { idJournal: activeJournal.idJournal, idPaymentMethod: dto.idPaymentMethod },
          });
          if (!pmb) {
            pmb = queryRunner.manager.create(PaymentMethodBalance, {
              idJournal: activeJournal.idJournal,
              idPaymentMethod: dto.idPaymentMethod,
              amount: 0,
            });
          }
          if (Number(pmb.amount) < dto.advanceAmount) {
            throw new BadRequestError(
              `Solde insuffisant dans la caisse pour ce mode de paiement. Disponible : ${Number(pmb.amount).toFixed(2)}, Requis : ${dto.advanceAmount.toFixed(2)}.`
            );
          }

          const cat = await getOrCreateCategory(queryRunner, "Paiement Fournisseur", -5);
          await createCashOutflow(
            queryRunner,
            dto.advanceAmount,
            `Paiement pour la livraison de la commande ${purchase.ref || purchase.idPurchase} (Fournisseur: ${supplier?.name || "Inconnu"})`,
            purchase.ref,
            operatorId,
            cat.idCashMovementCategory,
            activeJournal.idJournal,
            dto.idPaymentMethod
          );

          pmb.amount = Number(pmb.amount) - dto.advanceAmount;
          await queryRunner.manager.save(PaymentMethodBalance, pmb);

          const { totalExpected } = await queryRunner.manager
            .createQueryBuilder(PaymentMethodBalance, "pmb")
            .select("SUM(pmb.amount)", "totalExpected")
            .where("pmb.id_journal = :idJournal", { idJournal: activeJournal.idJournal })
            .getRawOne();
          activeJournal.expectedClosingBalance = Number(totalExpected || 0);
          await queryRunner.manager.save(CashJournal, activeJournal);
        }

        // 7. Sync supplier balance (credit and debit)
        await this.syncSupplierBalance(purchase.idSupplier, queryRunner.manager);
        recipeService.recalculateAllActiveCosts().catch(console.error);
      } else {
        // Normal purchase without immediate delivery (Advance payment if any)
        if (dto.advanceAmount && dto.advanceAmount > 0 && dto.idPaymentMethod) {
          if (dto.advanceAmount > totalAmount) {
            throw new BadRequestError("Le montant payé ne peut pas dépasser le montant total de la commande.");
          }

          const payment = queryRunner.manager.create(SupplierPayment, {
            idSupplier: purchase.idSupplier,
            idProcessedBy: operatorId,
            idPaymentMethod: dto.idPaymentMethod,
            amount: dto.advanceAmount,
            paymentDate: new Date(),
            notes: `Avance pour la commande fournisseur (Réf: ${purchase.ref || purchase.idPurchase})`,
          });
          await queryRunner.manager.save(SupplierPayment, payment);

          // Advance → Supplier Credit
          const creditAlloc = queryRunner.manager.create(SupplierPaymentAllocation, {
            idSupplierPayment: payment.idSupplierPayment,
            allocationType: "SUPPLIER_CREDIT",
            amount: dto.advanceAmount,
          });
          await queryRunner.manager.save(SupplierPaymentAllocation, creditAlloc);

          await this.syncSupplierBalance(purchase.idSupplier, queryRunner.manager);
        }
      }

      await queryRunner.commitTransaction();

      return {
        ...purchase,
        status: getPurchaseStatusName(purchase.status),
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

      const preparedDetails = await this.preparePurchaseDetails(
        queryRunner,
        purchase,
        dto,
        deliveredQuantities,
      );

      await this.replacePurchaseDetails(queryRunner, purchase.idPurchase, preparedDetails.details);

      this.updatePurchaseData(purchase, dto, preparedDetails.totalAmount, userId);

      // Prevent TypeORM from syncing the old details relation and deleting the newly inserted details
      delete (purchase as any).details;

      await queryRunner.manager.save(Purchase, purchase);
      await queryRunner.commitTransaction();

      return {
        ...purchase,
        status: getPurchaseStatusName(purchase.status),
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
    purchase.lifecycleStatus = Boolean(dto.deliveryDone) ? 0 : 5;
    purchase.idSupplier = dto.idSupplier;
    purchase.idPurchaser = dto.idPurchaser || userId;
    return purchase;
  }

  private async prepareNewPurchaseDetails(queryRunner: any, idPurchase: string, dto: PurchaseDto) {
    let calculatedTotal = 0;
    const detailsToInsert = [];

    if (dto.details && dto.details.length > 0) {
      for (const detailDto of dto.details) {
        if (detailDto.quantity < 1) throw new BadRequestError(`La quantité doit être au moins 1.`);
        if (detailDto.unitPrice < 0)
          throw new BadRequestError(`Le prix unitaire ne peut pas être négatif.`);

        const suppliedItem = await queryRunner.manager.findOne(SuppliedItem, {
          where: { idSuppliedItem: detailDto.idSuppliedItem },
        });
        if (!suppliedItem)
          throw new NotFoundError(`Article fournisseur ${detailDto.idSuppliedItem} introuvable`);

        const lineTotal = detailDto.quantity * detailDto.unitPrice;
        calculatedTotal += lineTotal;
        detailsToInsert.push({
          idPurchase: idPurchase,
          idSuppliedItem: detailDto.idSuppliedItem,
          quantity: detailDto.quantity,
          unitPrice: detailDto.unitPrice,
          totalAmount: lineTotal,
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
      relations: { details: true },
    });
    if (!purchase) throw new NotFoundError("Commande introuvable");
    return purchase;
  }

  private validatePurchaseCanBeUpdated(purchase: Purchase): void {
    if (purchase.lifecycleStatus !== 5 && purchase.lifecycleStatus !== 0) {
      throw new BadRequestError("Cette commande ne peut plus être modifiée (statut invalide).");
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
      throw new BadRequestError(
        "Impossible de modifier une commande avec une livraison en cours (OUVERTE).",
      );
    }
  }

  private async getDeliveredQuantities(
    queryRunner: any,
    purchase: Purchase,
  ): Promise<Map<string, number>> {
    const deliveredQuantities = new Map<string, number>();

    if (
      purchase.status === PURCHASE_STATUS.PARTIALLY_DELIVERED ||
      purchase.status === PURCHASE_STATUS.DELIVERED
    ) {
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

  private validateSupplierChange(
    purchase: Purchase,
    dto: PurchaseDto,
    deliveredQuantities: Map<string, number>,
  ): void {
    if (deliveredQuantities.size > 0 && purchase.idSupplier !== dto.idSupplier) {
      throw new BadRequestError(
        "Impossible de changer le fournisseur d'une commande partiellement livrée.",
      );
    }
  }

  private async validateSuppliedItemQuantity(
    queryRunner: any,
    detailDto: PurchaseDetailDto,
    deliveredQuantities: Map<string, number>,
  ): Promise<void> {
    const suppliedItem = await queryRunner.manager.findOne(SuppliedItem, {
      where: { idSuppliedItem: detailDto.idSuppliedItem },
      relations: { item: true },
    });
    if (!suppliedItem)
      throw new NotFoundError(`Article fournisseur ${detailDto.idSuppliedItem} introuvable`);

    const deliveredQty = deliveredQuantities.get(detailDto.idSuppliedItem) || 0;
    if (detailDto.quantity < deliveredQty) {
      const itemName = suppliedItem.item?.label || detailDto.idSuppliedItem;
      throw new BadRequestError(
        `La quantité de l'article "${itemName}" ne peut pas être inférieure à  la quantité déjà  livrée (${deliveredQty}).`,
      );
    }
  }

  private async preparePurchaseDetails(
    queryRunner: any,
    purchase: Purchase,
    dto: PurchaseDto,
    deliveredQuantities: Map<string, number>,
  ) {
    let calculatedTotal = 0;
    const detailsToInsert = [];
    const newDetailIds = dto.details ? dto.details.map((d) => d.idSuppliedItem) : [];

    if (dto.details && dto.details.length > 0) {
      for (const detailDto of dto.details) {
        if (detailDto.quantity < 1) throw new BadRequestError("La quantité doit être au moins 1.");
        if (detailDto.unitPrice < 0)
          throw new BadRequestError("Le prix unitaire ne peut pas être négatif.");

        await this.validateSuppliedItemQuantity(queryRunner, detailDto, deliveredQuantities);

        const lineTotal = detailDto.quantity * detailDto.unitPrice;
        calculatedTotal += lineTotal;
        detailsToInsert.push({
          idPurchase: purchase.idPurchase,
          idSuppliedItem: detailDto.idSuppliedItem,
          quantity: detailDto.quantity,
          unitPrice: detailDto.unitPrice,
          totalAmount: lineTotal,
        });
      }
    }

    for (const oldDetail of purchase.details) {
      if (!newDetailIds.includes(oldDetail.idSuppliedItem)) {
        const deliveredQty = deliveredQuantities.get(oldDetail.idSuppliedItem) || 0;
        if (deliveredQty > 0) {
          throw new BadRequestError(
            `Impossible de supprimer l'article ${oldDetail.idSuppliedItem} car ${deliveredQty} unités ont déjà  été livrées.`,
          );
        }
      }
    }

    return { details: detailsToInsert, totalAmount: calculatedTotal };
  }

  private async replacePurchaseDetails(
    queryRunner: any,
    idPurchase: string,
    detailsToInsert: any[],
  ): Promise<void> {
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

  private updatePurchaseData(
    purchase: Purchase,
    dto: PurchaseDto,
    calculatedTotal: number,
    userId: string,
  ): void {
    purchase.purchaseDate = dto.purchaseDate ? new Date(dto.purchaseDate) : purchase.purchaseDate;
    purchase.idSupplier = dto.idSupplier;
    purchase.idPurchaser = dto.idPurchaser || purchase.idPurchaser || userId;
    purchase.totalAmount = calculatedTotal;
  }

  async confirmPurchase(idPurchase: string, userId: string): Promise<Purchase> {
    const purchase = await Purchase.findOne({ where: { idPurchase } });
    if (!purchase) throw new NotFoundError("Commande introuvable");
    if (purchase.lifecycleStatus !== 5) {
      // 5 = Ouvert
      throw new BadRequestError("Seule une commande au statut 'Ouvert' peut être confirmée.");
    }

    purchase.lifecycleStatus = 0; // 0 = Confirmé
    await purchase.save();
    return {
      ...purchase,
      status: getPurchaseStatusName(purchase.status),
    } as any;
  }

  async cancelPurchase(
    idPurchase: string,
    userId: string,
    options?: { forceAction?: "delete" | "confirm" },
  ): Promise<Purchase> {
    const purchase = await Purchase.findOne({ where: { idPurchase } });
    if (!purchase) throw new NotFoundError("Commande introuvable");
    if (purchase.lifecycleStatus === -3) {
      // -3 = Annulé
      throw new BadRequestError("Cette commande est déjà  annulée.");
    }

    if (purchase.status === PURCHASE_STATUS.DELIVERED) {
      // 0 = Livré
      throw new BadRequestError("Impossible d'annuler une commande déjà  entièrement livrée.");
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
        throw new BadRequestError("livraison non validée");
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

    purchase.lifecycleStatus = -3; // Annulé
    await purchase.save();

    return {
      ...purchase,
      status: getPurchaseStatusName(purchase.status),
    } as any;
  }

  async findAll(
    options: {
      page?: number;
      limit?: number;
      status?: number;
      lifecycleStatus?: number;
      idSupplier?: string;
      startDate?: string;
      endDate?: string;
    } = {},
  ): Promise<Paginated<any>> {
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
        "purchase.idPurchaser",
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
      qb.andWhere("purchase.lifecycleStatus = :lifecycleStatus", {
        lifecycleStatus: options.lifecycleStatus,
      });
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
      status: record.lifecycleStatus === -3 ? "Annulé" : getPurchaseStatusName(record.status),
      lifecycleStatus: record.lifecycleStatus ?? 5,
    }));

    return {
      records: mappedRecords,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
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
          name: true,
        },
        purchaser: {
          idEmployee: true,
          name: true,
          lastname: true,
        },
      },
      relations: {
        supplier: true,
        purchaser: true,
      },
    });

    if (!purchase) return null;

    return {
      ...purchase,
      status: purchase.lifecycleStatus === -3 ? "Annulé" : getPurchaseStatusName(purchase.status),
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
            ref: true,
          },
          supplierProduct: {
            idSupplierProduct: true,
            name: true,
            actualPrice: true,
          },
        },
      },
      relations: {
        suppliedItem: {
          item: true,
          supplierProduct: true,
        },
      },
    });
  }

  async getPurchaseDeliveries(idPurchase: string): Promise<any[]> {
    // 1. Get supplied items for this purchase
    const purchaseDetails = await PurchaseDetail.find({
      where: { idPurchase },
      select: { idSuppliedItem: true },
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
        suppliedItemIds.includes(d.idSuppliedItem),
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

  private async syncSupplierBalance(idSupplier: string, manager: any): Promise<void> {
    const debitResult = await manager.query(
      `SELECT SUM(d.balance_due) as total_debit
       FROM product_delivery d
       JOIN purchase_delivery pd ON pd.id_delivery = d.id_delivery
       JOIN purchases p ON p.id_purchase = pd.id_purchase
       WHERE p.id_supplier = $1 AND d.status = 0`,
      [idSupplier],
    );
    const debit = Number(debitResult[0]?.total_debit || 0);

    const creditResult = await manager.query(
      `SELECT SUM(spa.amount) as total_credit
       FROM supplier_payment_allocation spa
       JOIN supplier_payment sp ON sp.id_supplier_payment = spa.id_supplier_payment
       WHERE sp.id_supplier = $1 AND spa.allocation_type = 'SUPPLIER_CREDIT'`,
      [idSupplier],
    );
    const credit = Number(creditResult[0]?.total_credit || 0);

    let balance = await manager.findOne(SupplierBalance, { where: { idSupplier } });
    if (!balance) {
      balance = manager.create(SupplierBalance, { idSupplier });
    }
    balance.debit = debit;
    balance.credit = credit;
    await manager.save(SupplierBalance, balance);
  }
}
