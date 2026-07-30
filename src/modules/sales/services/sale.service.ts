import AppDataSource from "../../../database/data-source";
import { Sale } from "../../../database/Entities/Sale";
import { SaleItem } from "../../../database/Entities/SaleItem";
import { Invoice } from "../../../database/Entities/Invoice";
import { Payment } from "../../../database/Entities/Payment";
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
      const invoice = new Invoice();
      invoice.invoiceDate = dto.saleDate;
      invoice.totalAmount = 0;
      invoice.balanceDue = 0;
      invoice.invoiceNumber = dto.invoiceNumber || null;
      invoice.createdBy = userId;
      invoice.status = 5;
      const savedInvoice = await queryRunner.manager.save(Invoice, invoice);

      const sale = new Sale();
      sale.saleDate = dto.saleDate;
      sale.totalAmount = 0;
      sale.tableNumber = dto.tableNumber ? Number(dto.tableNumber) : null;
      sale.comment = dto.comment || null;
      sale.deliveryDate = dto.deliveryDate ? new Date(dto.deliveryDate) : null;
      sale.chargeToRoom = dto.chargeToRoom ?? false;
      sale.idRoom = dto.idRoom || null;
      sale.idInvoice = savedInvoice.idInvoice;
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

      savedInvoice.totalAmount = calculatedTotal;
      savedInvoice.balanceDue = calculatedTotal;
      await queryRunner.manager.save(Invoice, savedInvoice);

      if (dto.payment) {
        if (dto.payment.amount < 0) throw new BadRequestError("Le montant du paiement ne peut pas être négatif.");
        const payment = new Payment();
        payment.idInvoice = savedInvoice.idInvoice;
        payment.paymentDate = dto.payment.paymentDate;
        
        // Cap the saved payment to the total amount (so overpayments are treated as change returned)
        payment.amount = Math.min(dto.payment.amount, calculatedTotal);
        
        payment.idPaymentMethod = dto.payment.idPaymentMethod;
        payment.paymentCode = dto.payment.paymentCode || null;
        if (payment.amount > 0) {
          await queryRunner.manager.save(Payment, payment);
        }
        
        savedInvoice.balanceDue = Number(savedInvoice.totalAmount) - Number(payment.amount);
        if (savedInvoice.balanceDue <= 0) {
          savedInvoice.balanceDue = 0;
          savedInvoice.status = 0;
        } else {
          savedInvoice.status = 3;
        }
        await queryRunner.manager.save(Invoice, savedInvoice);
      }

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
        .where("sale.id_sale = :idSale", { idSale })
        .getOne();

      if (!sale) {
        throw new NotFoundError("Vente introuvable");
      }
      
      sale.saleItems = await queryRunner.manager.find(SaleItem, { where: { idSale } });
      if (sale.idInvoice) {
        const inv = await queryRunner.manager.findOne(Invoice, { where: { idInvoice: sale.idInvoice } });
        if (inv) sale.invoice = inv;
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
      if (dto.comment !== undefined) sale.comment = dto.comment || null;
      if (dto.deliveryDate !== undefined) sale.deliveryDate = dto.deliveryDate ? new Date(dto.deliveryDate) : null;
      if (dto.chargeToRoom !== undefined) sale.chargeToRoom = dto.chargeToRoom;
      if (dto.idRoom !== undefined) sale.idRoom = dto.idRoom || null;
      if (dto.invoiceNumber !== undefined && sale.invoice) {
        sale.invoice.invoiceNumber = dto.invoiceNumber;
      }
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

      if (dto.payment && dto.payment.amount > 0 && sale.invoice) {
        const currentPayments = await queryRunner.manager.find(Payment, { where: { idInvoice: sale.invoice.idInvoice } });
        const alreadyPaid = currentPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        const maxAllowed = Math.max(0, Number(sale.totalAmount) - alreadyPaid);
        
        const amountToSave = Math.min(dto.payment.amount, maxAllowed);
        
        if (amountToSave > 0) {
          const payment = new Payment();
          payment.idInvoice = sale.invoice.idInvoice;
          payment.paymentDate = dto.payment.paymentDate ? new Date(dto.payment.paymentDate) : new Date();
          payment.amount = amountToSave;
          payment.idPaymentMethod = dto.payment.idPaymentMethod;
          payment.paymentCode = dto.payment.paymentCode || null;
          await queryRunner.manager.save(Payment, payment);
        }
      }

      if (sale.invoice) {
        sale.invoice.totalAmount = Number(sale.totalAmount);
        const payments = await queryRunner.manager.find(Payment, { where: { idInvoice: sale.invoice.idInvoice } });
        const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const newBalance = Number(sale.totalAmount) - totalPaid;

        if (newBalance < 0) {
          if (dto.overpaymentAction === "REFUND") {
            const refundPayment = new Payment();
            refundPayment.idInvoice = sale.invoice.idInvoice;
            refundPayment.paymentDate = new Date();
            refundPayment.amount = newBalance; // This will be a negative amount
            const firstPayment = payments[0];
            if (!firstPayment) {
              throw new BadRequestError("Erreur système : Impossible de rembourser une vente qui n'a aucun paiement existant.");
            }
            
            refundPayment.idPaymentMethod = firstPayment.idPaymentMethod;
            refundPayment.paymentCode = "Remboursement suite modification";
            await queryRunner.manager.save(Payment, refundPayment);
            
            sale.invoice.balanceDue = 0;
            sale.invoice.status = 0; // Closed
          } else if (dto.overpaymentAction === "ADJUST") {
            let amountToReduce = Math.abs(newBalance);
            // Sort payments by date to reduce the most recent ones first
            const sortedPayments = [...payments].sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
            
            for (const p of sortedPayments) {
              if (amountToReduce <= 0) break;
              
              if (Number(p.amount) <= amountToReduce) {
                amountToReduce -= Number(p.amount);
                await queryRunner.manager.remove(Payment, p);
              } else {
                p.amount = Number(p.amount) - amountToReduce;
                amountToReduce = 0;
                await queryRunner.manager.save(Payment, p);
              }
            }
            sale.invoice.balanceDue = 0;
            sale.invoice.status = 0;
          } else {
            throw new BadRequestError("Paiement excédentaire détecté. Le total de la vente ne peut pas être inférieur au montant déjà encaissé. Veuillez corriger les paiements d'abord.");
          }
        } else {
          sale.invoice.balanceDue = newBalance;
          if (newBalance === 0 && totalPaid > 0) sale.invoice.status = 0;
          else if (totalPaid > 0) sale.invoice.status = 3;
          else sale.invoice.status = 5;
        }
        await queryRunner.manager.save(Invoice, sale.invoice);
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
      .leftJoinAndSelect("sale.invoice", "invoice")
      .leftJoinAndSelect("invoice.payments", "payments")
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
        qb.andWhere("invoice.balance_due <= 0");
      } else if (options.paymentStatus === "UNPAID") {
        qb.andWhere("invoice.balance_due > 0 AND invoice.balance_due = invoice.total_amount");
      } else if (options.paymentStatus === "PARTIAL") {
        qb.andWhere("invoice.balance_due > 0 AND invoice.balance_due < invoice.total_amount");
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
      relations: { saler: true, room: true, saleItems: { menu: { item: true } }, invoice: { payments: true } }
    });
  }

  async cancelSale(idSale: string, userId: string, overpaymentAction?: "REFUND" | "ADJUST"): Promise<Sale> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const sale = await queryRunner.manager.createQueryBuilder(Sale, "sale")
        .setLock("pessimistic_write")
        .where("sale.id_sale = :idSale", { idSale })
        .getOne();
      if (!sale) throw new NotFoundError("Vente introuvable");

      sale.saleItems = await queryRunner.manager.find(SaleItem, { where: { idSale } });
      if (sale.idInvoice) {
        const inv = await queryRunner.manager.findOne(Invoice, { where: { idInvoice: sale.idInvoice } });
        if (inv) sale.invoice = inv;
      }

      const oldValue = { ...sale };
      sale.status = -3; // -3 = Annulée/Supprimée
      sale.updatedBy = userId;
      sale.totalAmount = 0; // The sale is cancelled, effectively 0 amount
      
      const updated = await queryRunner.manager.save(Sale, sale);

      if (sale.invoice) {
        sale.invoice.totalAmount = 0; // Since it was synced with sale
        const payments = await queryRunner.manager.find(Payment, { where: { idInvoice: sale.invoice.idInvoice } });
        const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        
        if (totalPaid > 0) {
          if (overpaymentAction === "REFUND") {
            const refundPayment = new Payment();
            refundPayment.idInvoice = sale.invoice.idInvoice;
            refundPayment.paymentDate = new Date();
            refundPayment.amount = -totalPaid;
            const firstPayment = payments[0];
            if (!firstPayment) {
              throw new BadRequestError("Erreur système : Impossible de rembourser une vente qui n'a aucun paiement existant.");
            }
            
            refundPayment.idPaymentMethod = firstPayment.idPaymentMethod;
            refundPayment.paymentCode = "Remboursement suite à l'annulation";
            await queryRunner.manager.save(Payment, refundPayment);
            
            sale.invoice.balanceDue = 0;
            sale.invoice.status = 0; // Closed
          } else if (overpaymentAction === "ADJUST") {
            let amountToReduce = totalPaid;
            const sortedPayments = [...payments].sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
            
            for (const p of sortedPayments) {
              if (amountToReduce <= 0) break;
              
              if (p.amount <= amountToReduce) {
                amountToReduce -= p.amount;
                await queryRunner.manager.remove(Payment, p);
              } else {
                p.amount -= amountToReduce;
                amountToReduce = 0;
                await queryRunner.manager.save(Payment, p);
              }
            }
            
            sale.invoice.balanceDue = 0;
            sale.invoice.status = 0; // Closed
          }
        } else {
          sale.invoice.balanceDue = 0;
          sale.invoice.status = 0;
        }
        await queryRunner.manager.save(Invoice, sale.invoice);
      }

      const auditLog = new AuditLog();
      auditLog.entityName = "Sale";
      auditLog.entityId = idSale;
      auditLog.action = "CANCEL_SALE";
      auditLog.oldValue = { status: oldValue.status, totalAmount: oldValue.totalAmount };
      auditLog.newValue = { status: -3, totalAmount: 0 };
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
      auditLog.oldValue = { totalAmount: sale.totalAmount };
      auditLog.newValue = null;
      auditLog.idUser = userId;
      await queryRunner.manager.save(AuditLog, auditLog);

      if (sale.idInvoice) {
        await queryRunner.manager.delete(Payment, { idInvoice: sale.idInvoice });
      }
      await queryRunner.manager.delete(SaleItem, { idSale });
      await queryRunner.manager.delete(Sale, { idSale });
      if (sale.idInvoice) {
        await queryRunner.manager.delete(Invoice, { idInvoice: sale.idInvoice });
      }

      await queryRunner.commitTransaction();
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
