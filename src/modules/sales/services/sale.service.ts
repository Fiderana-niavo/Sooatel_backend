import AppDataSource from "../../../database/data-source";
import { Sale } from "../../../database/Entities/Sale";
import { SaleItem } from "../../../database/Entities/SaleItem";
import { SalesPayment } from "../../../database/Entities/SalesPayment";
import { AuditLog } from "../../../database/Entities/AuditLog";
import { MenuItem } from "../../../database/Entities/MenuItem";
import { CreateSaleDto, UpdateSaleDto, SaleSearchOptions, ALLOWED_AUDIT_KEYS } from "../types/sale.type";
import { getDiff } from "../utils/diff.util";
import { NotFoundError, BadRequestError } from "../../../shared/errors/AppError";
import { Paginated } from "../../../shared/types/Paginated";

const sanitize = (obj: any): any => JSON.parse(JSON.stringify(obj));


export class SaleService {
  async createSale(dto: CreateSaleDto, userId: string): Promise<Sale> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const auditLogs: AuditLog[] = [];
      const sale = new Sale();
      sale.saleDate = dto.saleDate;
      sale.totalAmount = 0;
      sale.balanceDue = 0;
      sale.tableNumber = dto.tableNumber ? Number(dto.tableNumber) : null;
      sale.chargeToRoom = dto.chargeToRoom ?? false;
      sale.idRoom = dto.idRoom || null;
      sale.invoiceNumber = dto.invoiceNumber;
      if (!dto.idSaler) {
        throw new Error("L'identifiant du vendeur (idSaler) est requis.");
      }
      sale.idSaler = dto.idSaler;
      sale.createdBy = userId;
      sale.status = 5; // 5 = Ouverte

      const savedSale = await queryRunner.manager.save(Sale, sale);

      let calculatedTotal = 0;
      for (const itemDto of dto.items) {
        if (itemDto.quantity < 1) throw new BadRequestError(`La quantité pour le plat ${itemDto.idMenu} doit être au moins 1.`);
        if (itemDto.unitPrice < 0) throw new BadRequestError(`Le prix unitaire pour le plat ${itemDto.idMenu} ne peut pas être négatif.`);
        
        const menu = await queryRunner.manager.findOne(MenuItem, { where: { idMenu: itemDto.idMenu } });
        if (!menu) {
          throw new NotFoundError(`Plat ${itemDto.idMenu} introuvable`);
        }

        const saleItem = new SaleItem();
        saleItem.idSale = savedSale.idSale;
        saleItem.idMenu = itemDto.idMenu;
        saleItem.quantity = itemDto.quantity;
        saleItem.unitPrice = itemDto.unitPrice;
        saleItem.totalAmount = itemDto.quantity * itemDto.unitPrice;

        calculatedTotal += Number(saleItem.totalAmount);

        await queryRunner.manager.save(SaleItem, saleItem);
      }

      savedSale.totalAmount = calculatedTotal;
      await queryRunner.manager.save(Sale, savedSale);

      if (dto.payment) {
        if (dto.payment.amount < 0) throw new BadRequestError("Le montant du paiement ne peut pas être négatif.");
        const payment = new SalesPayment();
        payment.idSale = savedSale.idSale;
        payment.paymentDate = dto.payment.paymentDate;
        payment.amount = dto.payment.amount;
        payment.idPaymentMethod = dto.payment.idPaymentMethod;
        payment.type = "PAYMENT";
        await queryRunner.manager.save(SalesPayment, payment);
        savedSale.balanceDue = Number(savedSale.totalAmount) - Number(payment.amount);
      } else {
        savedSale.balanceDue = savedSale.totalAmount;
      }

      // No auto-close: fermeture manuelle uniquement
      if (savedSale.balanceDue < 0) savedSale.balanceDue = 0;

      await queryRunner.manager.save(Sale, savedSale);

      await queryRunner.commitTransaction();
      
      const auditLog = new AuditLog();
      auditLog.entityName = "Sale";
      auditLog.entityId = savedSale.idSale;
      auditLog.action = "CREATE_SALE";
      
      // Filter out ignored keys for CREATE
      const { diffNew } = getDiff({}, sanitize(savedSale), ALLOWED_AUDIT_KEYS);
      auditLog.newValue = diffNew;
      
      auditLog.idUser = userId;
      auditLogs.push(auditLog);

      if (auditLogs.length > 0) {
        await queryRunner.manager.save(AuditLog, auditLogs);
      }

      return savedSale;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateSale(idSale: string, dto: UpdateSaleDto, userId: string): Promise<Sale> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sale = await queryRunner.manager.createQueryBuilder(Sale, "sale")
        .setLock("pessimistic_write")
        .leftJoinAndSelect("sale.saleItems", "saleItems")
        .where("sale.id_sale = :idSale", { idSale })
        .getOne();

      if (!sale) {
        throw new NotFoundError("Vente introuvable");
      }

      const auditLogs: AuditLog[] = [];
      const oldValue = sanitize(sale);
      delete oldValue.saleItems;

      // Block only cancelled sales; closed (status=0) sales must be reopened first
      if (sale.status === -3) {
        throw new BadRequestError("Impossible de modifier une vente annulée.");
      }
      if (sale.status === 0) {
        throw new BadRequestError("Impossible de modifier une vente fermée. Veuillez la rouvrir d'abord.");
      }
      if (dto.saleDate !== undefined) sale.saleDate = dto.saleDate;
      if (dto.tableNumber !== undefined) sale.tableNumber = dto.tableNumber ? Number(dto.tableNumber) : null;
      if (dto.chargeToRoom !== undefined) sale.chargeToRoom = dto.chargeToRoom;
      if (dto.idRoom !== undefined) sale.idRoom = dto.idRoom || null;
      if (dto.invoiceNumber !== undefined) sale.invoiceNumber = dto.invoiceNumber;
      if (dto.idSaler !== undefined) sale.idSaler = dto.idSaler;

      if (dto.items && Array.isArray(dto.items)) {
        let calculatedTotal = 0;
        const existingItems = sale.saleItems || [];
        const incomingIds = new Set(dto.items.filter(i => i.idSaleItem).map(i => i.idSaleItem));
        
        for (const existing of existingItems) {
          if (!incomingIds.has(existing.idSaleItem)) {
            const oldItem = { ...existing };
            await queryRunner.manager.remove(SaleItem, existing);
            
            const auditLog = new AuditLog();
            auditLog.entityName = "SaleItem";
            auditLog.entityId = oldItem.idSaleItem;
            auditLog.action = "REMOVE_ITEM";
            const { diffOld } = getDiff(sanitize(oldItem), {}, ALLOWED_AUDIT_KEYS);
            auditLog.oldValue = diffOld;
            auditLog.idUser = userId;
            auditLogs.push(auditLog);
          }
        }

        for (const incoming of dto.items) {
          if (incoming.quantity < 1) throw new BadRequestError(`La quantité pour le plat ${incoming.idMenu} doit être au moins 1.`);
          if (incoming.unitPrice < 0) throw new BadRequestError(`Le prix unitaire pour le plat ${incoming.idMenu} ne peut pas être négatif.`);
          
          if (incoming.idSaleItem) {
            const existing = existingItems.find(i => i.idSaleItem === incoming.idSaleItem);
            if (existing) {
              const oldItem = { ...existing };
              
              existing.quantity = incoming.quantity;
              existing.unitPrice = incoming.unitPrice;
              existing.totalAmount = incoming.quantity * incoming.unitPrice;

              await queryRunner.manager.save(SaleItem, existing);
              
              const { diffOld, diffNew } = getDiff(sanitize(oldItem), sanitize(existing), ALLOWED_AUDIT_KEYS);
              if (Object.keys(diffNew).length > 0) {
                const auditLog = new AuditLog();
                auditLog.entityName = "SaleItem";
                auditLog.entityId = existing.idSaleItem;
                auditLog.action = "UPDATE_ITEM";
                auditLog.oldValue = diffOld;
                auditLog.newValue = diffNew;
                auditLog.idUser = userId;
                auditLogs.push(auditLog);
              }
              calculatedTotal += Number(existing.totalAmount);
            }
          } else {
            const menu = await queryRunner.manager.findOne(MenuItem, { where: { idMenu: incoming.idMenu } });
            if (!menu) {
              throw new NotFoundError(`Plat ${incoming.idMenu} introuvable`);
            }
            const newItem = new SaleItem();
            newItem.idSale = sale.idSale;
            newItem.idMenu = incoming.idMenu;
            newItem.quantity = incoming.quantity;
            newItem.unitPrice = incoming.unitPrice;
            newItem.totalAmount = incoming.quantity * incoming.unitPrice;
            const saved = await queryRunner.manager.save(SaleItem, newItem);
            
            const auditLog = new AuditLog();
            auditLog.entityName = "SaleItem";
            auditLog.entityId = saved.idSaleItem;
            auditLog.action = "ADD_ITEM";
            const { diffNew } = getDiff({}, sanitize(saved), ALLOWED_AUDIT_KEYS);
            auditLog.newValue = diffNew;
            auditLog.idUser = userId;
            auditLogs.push(auditLog);
            calculatedTotal += Number(saved.totalAmount);
          }
        }

        sale.totalAmount = calculatedTotal;
      }

      // Recalculate balanceDue from scratch: total - (sum of PAYMENT - sum of REFUND)
      const payments = await queryRunner.manager.find(SalesPayment, { where: { idSale } });
      const totalPaid = payments.reduce((sum, p) => p.type === "REFUND" ? sum - Number(p.amount) : sum + Number(p.amount), 0);
      const newBalance = Number(sale.totalAmount) - totalPaid;

      if (newBalance < 0) {
        throw new BadRequestError("Paiement excédentaire détecté. Le total de la vente ne peut pas être inférieur au montant déjà encaissé. Veuillez corriger les paiements d'abord.");
      } else {
        sale.balanceDue = newBalance;
      }

      sale.updatedBy = userId;
      // Clear in-memory saleItems so TypeORM doesn't try to sync/delete them
      delete (sale as any).saleItems;
      const updatedSale = await queryRunner.manager.save(Sale, sale);

      const SALE_UPDATE_ALLOWED_KEYS = ALLOWED_AUDIT_KEYS.filter(k => k !== "totalAmount" && k !== "balanceDue");
      const { diffOld, diffNew } = getDiff(oldValue, sanitize(updatedSale), SALE_UPDATE_ALLOWED_KEYS);
      if (Object.keys(diffNew).length > 0) {
        const auditLog = new AuditLog();
        auditLog.entityName = "Sale";
        auditLog.entityId = idSale;
        auditLog.action = "UPDATE_SALE";
        auditLog.oldValue = diffOld;
        auditLog.newValue = diffNew;
        auditLog.idUser = userId;
        auditLogs.push(auditLog);
      }

      if (auditLogs.length > 0) {
        await queryRunner.manager.save(AuditLog, auditLogs);
      }

      await queryRunner.commitTransaction();

      return updatedSale;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(options: SaleSearchOptions = {}): Promise<Paginated<Sale>> {
    const pageNum = options.page ?? 1;
    const limitNum = options.limit ?? 10;
    const repository = AppDataSource.getRepository(Sale);

    const qb = repository
      .createQueryBuilder("sale")
      .leftJoinAndSelect("sale.saler", "saler")
      .leftJoinAndSelect("sale.room", "room")
      .leftJoinAndSelect("sale.saleItems", "saleItems")
      .leftJoinAndSelect("saleItems.menu", "menu")
      .leftJoinAndSelect("menu.item", "item")
      .leftJoinAndSelect("sale.payments", "payments")
      .orderBy("sale.createdAt", "DESC")
      .skip((pageNum - 1) * limitNum)
      .take(limitNum);

    if (options.idMenu) {
      qb.innerJoin("sale_items", "saleItem", "saleItem.id_sale = sale.id_sale")
        .andWhere("saleItem.id_menu = :idMenu", { idMenu: options.idMenu });
    }

    if (options.date) {
      qb.andWhere("DATE(sale.saleDate) = :date", { date: options.date });
    }

    if (options.status && options.status.length > 0) {
      qb.andWhere("sale.status IN (:...status)", { status: options.status });
    }

    if (options.paymentStatus) {
      if (options.paymentStatus === "PAID") {
        qb.andWhere("sale.balanceDue <= 0");
      } else if (options.paymentStatus === "UNPAID") {
        qb.andWhere("sale.balanceDue > 0 AND sale.balanceDue = sale.totalAmount");
      } else if (options.paymentStatus === "PARTIAL") {
        qb.andWhere("sale.balanceDue > 0 AND sale.balanceDue < sale.totalAmount");
      }
    }

    const [records, total] = await qb.getManyAndCount();

    return {
      records,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    };
  }

  async getSaleById(idSale: string): Promise<Sale | null> {
    return Sale.findOne({
      where: { idSale },
      relations: { saler: true, room: true, saleItems: { menu: { item: true } }, payments: true }
    });
  }

  async cancelSale(idSale: string, userId: string): Promise<Sale> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const sale = await queryRunner.manager.createQueryBuilder(Sale, "sale").setLock("pessimistic_write").where("sale.id_sale = :idSale", { idSale }).getOne();
      if (!sale) throw new NotFoundError("Vente introuvable");

      const oldValue = { ...sale };
      sale.status = -3; // -3 = Annulée/Supprimée
      sale.updatedBy = userId;
      const updated = await queryRunner.manager.save(Sale, sale);

      const auditLog = new AuditLog();
      auditLog.entityName = "Sale";
      auditLog.entityId = idSale;
      auditLog.action = "CANCEL_SALE";
      auditLog.oldValue = { status: oldValue.status };
      auditLog.newValue = { status: -3 };
      auditLog.idUser = userId;
      await queryRunner.manager.save(AuditLog, auditLog);

      await queryRunner.commitTransaction();
      return updated;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async reopenSale(idSale: string, userId: string, reason: string): Promise<Sale> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const sale = await queryRunner.manager.createQueryBuilder(Sale, "sale").setLock("pessimistic_write").where("sale.id_sale = :idSale", { idSale }).getOne();
      if (!sale) throw new NotFoundError("Vente introuvable");

      const oldValue = { ...sale };
      sale.status = 5; // 5 = Ouverte/Réouverte
      sale.updatedBy = userId;
      const updated = await queryRunner.manager.save(Sale, sale);

      const auditLog = new AuditLog();
      auditLog.entityName = "Sale";
      auditLog.entityId = idSale;
      auditLog.action = "REOPEN_SALE";
      auditLog.oldValue = { status: oldValue.status };
      auditLog.newValue = { reason };
      auditLog.idUser = userId;
      await queryRunner.manager.save(AuditLog, auditLog);

      await queryRunner.commitTransaction();
      return updated;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteSale(idSale: string, userId: string): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const sale = await queryRunner.manager.createQueryBuilder(Sale, "sale").setLock("pessimistic_write").where("sale.id_sale = :idSale", { idSale }).getOne();
      if (!sale) throw new NotFoundError("Vente introuvable");

      const auditLog = new AuditLog();
      auditLog.entityName = "Sale";
      auditLog.entityId = idSale;
      auditLog.action = "DELETE";
      auditLog.oldValue = { invoiceNumber: sale.invoiceNumber, totalAmount: sale.totalAmount };
      auditLog.newValue = null;
      auditLog.idUser = userId;
      await queryRunner.manager.save(AuditLog, auditLog);

      await queryRunner.manager.delete(SalesPayment, { idSale });
      await queryRunner.manager.delete(SaleItem, { idSale });
      await queryRunner.manager.delete(Sale, { idSale });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async paySale(idSale: string, userId: string, paymentDto: { amount: number; idPaymentMethod: string; paymentDate?: string }): Promise<Sale> {
    if (paymentDto.amount < 0) {
      throw new BadRequestError("Le montant du paiement ne peut pas être négatif.");
    }
    
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const sale = await queryRunner.manager.createQueryBuilder(Sale, "sale").setLock("pessimistic_write").where("sale.id_sale = :idSale", { idSale }).getOne();
      if (!sale) throw new NotFoundError("Vente introuvable");

      const oldValue = { ...sale };

      const payment = new SalesPayment();
      payment.idSale = idSale;
      payment.paymentDate = paymentDto.paymentDate ? new Date(paymentDto.paymentDate) : new Date();
      payment.amount = paymentDto.amount;
      payment.idPaymentMethod = paymentDto.idPaymentMethod;
      payment.type = "PAYMENT";
      await queryRunner.manager.save(SalesPayment, payment);

      // Recalculate balanceDue from total - (sum of PAYMENT - sum of REFUND)
      const allPayments = await queryRunner.manager.find(SalesPayment, { where: { idSale } });
      const totalPaid = allPayments.reduce((sum, p) => p.type === "REFUND" ? sum - Number(p.amount) : sum + Number(p.amount), 0);
      sale.balanceDue = Math.max(0, Number(sale.totalAmount) - totalPaid);
      // No auto-close: fermeture manuelle uniquement

      sale.updatedBy = userId;
      const updated = await queryRunner.manager.save(Sale, sale);

      const auditLog = new AuditLog();
      auditLog.entityName = "Sale";
      auditLog.entityId = idSale;
      auditLog.action = "PAYMENT";
      auditLog.oldValue = { balanceDue: oldValue.balanceDue };
      auditLog.newValue = { balanceDue: updated.balanceDue, payment: payment.idSalePayment };
      auditLog.idUser = userId;
      await queryRunner.manager.save(AuditLog, auditLog);

      await queryRunner.commitTransaction();
      return updated;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async closeSale(idSale: string, userId: string): Promise<Sale> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const sale = await queryRunner.manager.createQueryBuilder(Sale, "sale").setLock("pessimistic_write").where("sale.id_sale = :idSale", { idSale }).getOne();
      if (!sale) throw new NotFoundError("Vente introuvable");
      if (sale.status === -3) throw new BadRequestError("Impossible de fermer une vente annulée");
      if (sale.status === 0) throw new BadRequestError("La vente est déjà fermée");

      const oldValue = { ...sale };
      sale.status = 0;
      sale.updatedBy = userId;
      const updated = await queryRunner.manager.save(Sale, sale);

      await queryRunner.commitTransaction();
      return updated;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
