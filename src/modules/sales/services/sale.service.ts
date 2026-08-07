import AppDataSource from "../../../database/data-source";
import { Sale } from "../../../database/Entities/Sale";
import { SaleItem } from "../../../database/Entities/SaleItem";
import { Invoice } from "../../../database/Entities/Invoice";
import { Payment } from "../../../database/Entities/Payment";
import { CashMovement } from "../../../database/Entities/CashMovement";
import { AuditLog } from "../../../database/Entities/AuditLog";
import { MenuItem } from "../../../database/Entities/MenuItem";
import { getOrCreateCategory, getOpenJournal, createCashOutflow, createCashInflow, resolveEmployeeId } from "../utils/sale-cash-movement.util";
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
      sale.tableNumber = (dto.tableNumber !== undefined && dto.tableNumber !== null && dto.tableNumber !== "") ? Number(dto.tableNumber) : null;
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
      const saleItemsToInsert = [];

      for (const itemDto of dto.items) {
        if (itemDto.quantity < 1) throw new BadRequestError(`La quantité pour le plat ${itemDto.idMenu} doit être au moins 1.`);
        if (itemDto.unitPrice < 0) throw new BadRequestError(`Le prix unitaire pour le plat ${itemDto.idMenu} ne peut pas être négatif.`);

        const menu = await queryRunner.manager.findOne(MenuItem, { where: { idMenu: itemDto.idMenu }, select: { idMenu: true } });
        if (!menu) throw new NotFoundError(`Plat ${itemDto.idMenu} introuvable`);

        const lineTotal = itemDto.quantity * itemDto.unitPrice;
        calculatedTotal += lineTotal;
        saleItemsToInsert.push({
          idSale: savedSale.idSale,
          idMenu: itemDto.idMenu,
          quantity: itemDto.quantity,
          unitPrice: itemDto.unitPrice,
          totalAmount: lineTotal
        });
      }

      if (saleItemsToInsert.length > 0) {
        await queryRunner.manager
          .createQueryBuilder()
          .insert()
          .into(SaleItem)
          .values(saleItemsToInsert)
          .execute();
      }

      await queryRunner.manager.update(Sale, savedSale.idSale, { totalAmount: calculatedTotal });
      await queryRunner.manager.update(Invoice, savedInvoice.idInvoice, { totalAmount: calculatedTotal, balanceDue: calculatedTotal });

      if (dto.payment) {
        if (dto.payment.amount < 0) throw new BadRequestError("Le montant du paiement ne peut pas être négatif.");
        if (dto.payment.paymentDate && new Date(dto.payment.paymentDate) > new Date()) {
          throw new BadRequestError("La date de paiement ne peut pas être dans le futur.");
        }
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

      // Audit log for CREATE_SALE removed as per request

      // We don't save any audit log during create anymore
      // if (auditLogs.length > 0) {
      //   await queryRunner.manager.save(AuditLog, auditLogs);
      // }

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
      if (dto.saleDate !== undefined) sale.saleDate = dto.saleDate ? new Date(dto.saleDate) : new Date();
      if (dto.tableNumber !== undefined) sale.tableNumber = (dto.tableNumber !== null && dto.tableNumber !== "") ? Number(dto.tableNumber) : null;
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
        const alreadyPaid = currentPayments
          .filter(p => p.paymentCode !== "Remboursement manuel")
          .reduce((sum, p) => sum + Number(p.amount), 0);
        const maxAllowed = Math.max(0, Number(sale.totalAmount) - alreadyPaid);

        const amountToSave = Math.min(dto.payment.amount, maxAllowed);

        if (amountToSave > 0) {
          if (dto.payment.paymentDate && new Date(dto.payment.paymentDate) > new Date()) {
            throw new BadRequestError("La date de paiement ne peut pas être dans le futur.");
          }
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
        // Exclude manual refunds from balance calculation — they are independent cash movements
        const totalPaid = payments
          .filter(p => p.paymentCode !== "Remboursement manuel")
          .reduce((sum, p) => sum + Number(p.amount), 0);
        const newBalance = Number(sale.totalAmount) - totalPaid;

        if (newBalance < 0) {
          if (dto.overpaymentAction === "REFUND") {
            if (!dto.idPaymentMethodRefund) {
              throw new BadRequestError("Le mode de paiement est requis pour un remboursement.");
            }

            const refundCat = await getOrCreateCategory(queryRunner, "Remboursement Client", -5);
            const openJournal = await getOpenJournal(queryRunner);
            if (!openJournal) throw new BadRequestError("Impossible de créer le remboursement en caisse : Aucun journal ouvert trouvé.");
            const idEmployee = await resolveEmployeeId(queryRunner, userId);

            const cashMvt = await createCashOutflow(
              queryRunner,
              Math.abs(newBalance),
              `Remboursement suite modification de la vente (Facture ${sale.invoice.invoiceNumber || 'N/A'})`,
              sale.invoice.invoiceNumber || null,
              idEmployee,
              refundCat.idCashMovementCategory,
              openJournal.idJournal,
              dto.idPaymentMethodRefund
            );

            const refundPayment = new Payment();
            refundPayment.idInvoice = sale.invoice.idInvoice;
            refundPayment.paymentDate = new Date();
            refundPayment.amount = newBalance;
            refundPayment.idPaymentMethod = dto.idPaymentMethodRefund;
            refundPayment.paymentCode = "Remboursement suite modification";
            refundPayment.idCashMovement = cashMvt.idCashMovement;
            await queryRunner.manager.save(Payment, refundPayment);

            sale.invoice.balanceDue = 0;
            sale.invoice.status = 0;
          } else if (dto.overpaymentAction === "ADJUST") {
            if (!dto.idPaymentToAdjust) {
              throw new BadRequestError("Veuillez sélectionner le paiement à ajuster.");
            }

            const paymentToAdjust = payments.find(p => p.idPayment === dto.idPaymentToAdjust);
            if (!paymentToAdjust) {
              throw new BadRequestError("Le paiement sélectionné pour ajustement est introuvable.");
            }

            let amountToReduce = Math.abs(newBalance);
            if (Number(paymentToAdjust.amount) < amountToReduce) {
              throw new BadRequestError("La somme à déduire est supérieure au montant du paiement choisi.");
            }

            let adjCat: any = null;
            let openJournal: any = null;
            if (paymentToAdjust.idCashMovement) {
              adjCat = await getOrCreateCategory(queryRunner, "Ajustement de vente", -5);
              openJournal = await getOpenJournal(queryRunner);
            }

            if (paymentToAdjust.idCashMovement && openJournal && adjCat) {
              const idEmployee = await resolveEmployeeId(queryRunner, userId);
              await createCashOutflow(
                queryRunner,
                amountToReduce,
                `Ajustement suite réduction/suppression de paiement (Facture ${sale.invoice.invoiceNumber || 'N/A'})`,
                sale.invoice.invoiceNumber || null,
                idEmployee,
                adjCat.idCashMovementCategory,
                openJournal.idJournal,
                paymentToAdjust.idPaymentMethod
              );
            }

            if (Number(paymentToAdjust.amount) === amountToReduce) {
              await queryRunner.manager.remove(Payment, paymentToAdjust);
            } else {
              paymentToAdjust.amount = Number(paymentToAdjust.amount) - amountToReduce;
              await queryRunner.manager.save(Payment, paymentToAdjust);
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
      delete (sale as any).saleItems;
      const updatedSale = await queryRunner.manager.save(Sale, sale);

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
      .leftJoinAndSelect("payments.cashMovement", "cashMovement")
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

  async cancelSale(idSale: string, userId: string, overpaymentAction?: "REFUND" | "ADJUST", idPaymentMethodRefund?: string): Promise<Sale> {
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
        const totalPaid = payments
          .filter(p => p.paymentCode !== "Remboursement manuel")
          .reduce((sum, p) => sum + Number(p.amount), 0);

        if (totalPaid > 0) {
          if (overpaymentAction === "REFUND") {
            if (!idPaymentMethodRefund) {
              throw new BadRequestError("Le mode de paiement est requis pour un remboursement.");
            }

            const refundCat = await getOrCreateCategory(queryRunner, "Remboursement Client", -5);
            const openJournal = await getOpenJournal(queryRunner);
            if (!openJournal) throw new BadRequestError("Impossible de créer le remboursement en caisse : Aucun journal ouvert trouvé.");
            const idEmployee = await resolveEmployeeId(queryRunner, userId);

            const cashMvt = await createCashOutflow(
              queryRunner,
              totalPaid,
              `Remboursement suite à l'annulation de la vente (Facture ${sale.invoice.invoiceNumber || 'N/A'})`,
              sale.invoice.invoiceNumber || null,
              idEmployee,
              refundCat.idCashMovementCategory,
              openJournal.idJournal,
              idPaymentMethodRefund
            );

            // 2. Then create Payment linked to the CashMovement
            const refundPayment = new Payment();
            refundPayment.idInvoice = sale.invoice.idInvoice;
            refundPayment.paymentDate = new Date();
            refundPayment.amount = -totalPaid;
            refundPayment.idPaymentMethod = idPaymentMethodRefund;
            refundPayment.paymentCode = "Remboursement suite à l'annulation";
            refundPayment.idCashMovement = cashMvt.idCashMovement;
            await queryRunner.manager.save(Payment, refundPayment);

            sale.invoice.balanceDue = 0;
            sale.invoice.status = 0;
          } else if (overpaymentAction === "ADJUST") {
            let amountToReduce = totalPaid;
            const sortedPayments = [...payments].sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

            const needsAdj = sortedPayments.some(p => p.idCashMovement);
            let adjCat: any = null;
            let openJournal: any = null;
            let idEmployee: string | null = null;
            if (needsAdj) {
              adjCat = await getOrCreateCategory(queryRunner, "Ajustement de vente", -5);
              openJournal = await getOpenJournal(queryRunner);
              idEmployee = await resolveEmployeeId(queryRunner, userId);
            }

            for (const p of sortedPayments) {
              if (amountToReduce <= 0) break;
              if (Number(p.amount) <= 0) continue;

              const reducedAmount = Math.min(Number(p.amount), amountToReduce);

              if (p.idCashMovement && openJournal && adjCat && idEmployee) {
                await createCashOutflow(
                  queryRunner,
                  reducedAmount,
                  `Ajustement suite annulation de la vente (Facture ${sale.invoice.invoiceNumber || 'N/A'})`,
                  sale.invoice.invoiceNumber || null,
                  idEmployee,
                  adjCat.idCashMovementCategory,
                  openJournal.idJournal,
                  p.idPaymentMethod
                );
              }

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
      auditLog.oldValue = { totalAmount: oldValue.totalAmount };
      auditLog.newValue = { totalAmount: 0 };
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

  async adjustPayment(idSale: string, idPayment: string, userId: string, newAmount: number): Promise<Sale> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const sale = await queryRunner.manager.createQueryBuilder(Sale, "sale")
        .leftJoinAndSelect("sale.invoice", "invoice")
        .setLock("pessimistic_write", undefined, ["sale"])
        .where("sale.id_sale = :idSale", { idSale })
        .getOne();
      if (!sale || !sale.invoice) throw new NotFoundError("Vente introuvable");

      const payment = await queryRunner.manager.findOne(Payment, { where: { idPayment, idInvoice: sale.invoice.idInvoice } });
      if (!payment) throw new NotFoundError("Paiement introuvable");

      const oldAmount = Number(payment.amount);
      if (newAmount === oldAmount) {
        await queryRunner.rollbackTransaction();
        return sale;
      }

      const isSystemRefund = payment.paymentCode?.includes("suite modification") || payment.paymentCode?.includes("suite à l'annulation");
      if (isSystemRefund) {
        throw new BadRequestError("Impossible de modifier un remboursement généré par le système.");
      }

      const isManualRefund = oldAmount < 0 || payment.paymentCode?.startsWith("Remboursement manuel");
      const diff = oldAmount - newAmount;
      const needsMovement = !!payment.idCashMovement;

      if (isManualRefund) {
        if (newAmount > 0) throw new BadRequestError("Un remboursement doit conserver un montant négatif.");

        if (needsMovement) {
          const cashMovement = await queryRunner.manager.findOne(CashMovement, { where: { idCashMovement: payment.idCashMovement as string } });
          if (cashMovement) {
            if (newAmount === 0) {
              await queryRunner.manager.remove(CashMovement, cashMovement);
            } else {
              cashMovement.amount = Math.abs(newAmount);
              await queryRunner.manager.save(CashMovement, cashMovement);
            }
          }
        }
      } else if (needsMovement) {
        const openJournal = await getOpenJournal(queryRunner);
        if (!openJournal) throw new BadRequestError("Aucun journal ouvert trouvé pour enregistrer l'ajustement.");

        if (diff > 0) {
          const cat = await getOrCreateCategory(queryRunner, "Ajustement de paiement (Sortie)", -5);
          const idEmployee = await resolveEmployeeId(queryRunner, userId);
          await createCashOutflow(
            queryRunner,
            diff,
            `Ajustement à la baisse du paiement (Facture ${sale.invoice.invoiceNumber || 'N/A'})`,
            sale.invoice.invoiceNumber || null,
            idEmployee,
            cat.idCashMovementCategory,
            openJournal.idJournal,
            payment.idPaymentMethod
          );
        } else if (diff < 0) {
          const catInflow = await getOrCreateCategory(queryRunner, "Ajustement de paiement (Entrée)", 5);
          const idEmployee = await resolveEmployeeId(queryRunner, userId);
          await createCashInflow(
            queryRunner,
            Math.abs(diff),
            `Ajustement à la hausse du paiement (Facture ${sale.invoice.invoiceNumber || 'N/A'})`,
            sale.invoice.invoiceNumber || null,
            idEmployee,
            catInflow.idCashMovementCategory,
            openJournal.idJournal,
            payment.idPaymentMethod
          );
        }
      }

      if (newAmount === 0) {
        await queryRunner.manager.remove(Payment, payment);
      } else {
        payment.amount = newAmount;
        await queryRunner.manager.save(Payment, payment);
      }

      // Recalculate invoice
      const payments = await queryRunner.manager.find(Payment, { where: { idInvoice: sale.invoice.idInvoice } });
      const totalPaid = payments
        .filter(p => !p.paymentCode?.startsWith("Remboursement manuel"))
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const newBalance = Number(sale.totalAmount) - totalPaid;

      sale.invoice.balanceDue = newBalance;
      if (newBalance <= 0) sale.invoice.status = 0;
      else if (totalPaid > 0) sale.invoice.status = 3;
      else sale.invoice.status = 5;

      await queryRunner.manager.save(Invoice, sale.invoice);

      const auditLog = new AuditLog();
      auditLog.entityName = "Payment";
      auditLog.entityId = idPayment;
      auditLog.action = newAmount === 0 ? "DELETE_PAYMENT" : "UPDATE_PAYMENT";
      auditLog.oldValue = { amount: Math.abs(oldAmount) };
      auditLog.newValue = { amount: Math.abs(newAmount) };
      auditLog.idUser = userId;
      await queryRunner.manager.save(AuditLog, auditLog);

      await queryRunner.commitTransaction();

      return (await queryRunner.manager.createQueryBuilder(Sale, "sale")
        .leftJoinAndSelect("sale.saler", "saler")
        .leftJoinAndSelect("sale.room", "room")
        .leftJoinAndSelect("sale.saleItems", "saleItems")
        .leftJoinAndSelect("saleItems.menu", "menu")
        .leftJoinAndSelect("sale.invoice", "invoice")
        .leftJoinAndSelect("invoice.payments", "payments")
        .leftJoinAndSelect("payments.cashMovement", "cashMovement")
        .where("sale.id_sale = :idSale", { idSale })
        .getOne()) as Sale;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async refundPayment(idSale: string, userId: string, amount: number, idPaymentMethod: string, reason?: string): Promise<Sale> {
    if (amount <= 0) throw new BadRequestError("Le montant du remboursement doit être positif.");

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const sale = await queryRunner.manager.createQueryBuilder(Sale, "sale")
        .leftJoinAndSelect("sale.invoice", "invoice")
        .setLock("pessimistic_write", undefined, ["sale"])
        .where("sale.id_sale = :idSale", { idSale })
        .getOne();
      if (!sale || !sale.invoice) throw new NotFoundError("Vente introuvable");

      // 1. Create CashOutflow first
      const openJournal = await getOpenJournal(queryRunner);
      if (!openJournal) throw new BadRequestError("Aucun journal ouvert trouvé pour enregistrer le remboursement.");

      const refundReason = reason ? ` - ${reason}` : "";
      const cat = await getOrCreateCategory(queryRunner, "Remboursement Client", -5);
      const idEmployee = await resolveEmployeeId(queryRunner, userId);
      const cashMovement = await createCashOutflow(
        queryRunner,
        amount,
        `Remboursement manuel (Facture ${sale.invoice.invoiceNumber || 'N/A'})${refundReason}`,
        sale.invoice.invoiceNumber || null,
        idEmployee,
        cat.idCashMovementCategory,
        openJournal.idJournal,
        idPaymentMethod
      );

      // 2. Create Payment linked to the CashMovement
      const refund = new Payment();
      refund.idInvoice = sale.invoice.idInvoice;
      refund.paymentDate = new Date();
      refund.amount = -amount;
      refund.idPaymentMethod = idPaymentMethod;
      refund.paymentCode = "Remboursement manuel";
      refund.idCashMovement = cashMovement.idCashMovement;
      await queryRunner.manager.save(Payment, refund);

      // 3. Recalculate invoice using SQL SUM
      const { totalPaid } = await queryRunner.manager
        .createQueryBuilder(Payment, "p")
        .select("COALESCE(SUM(p.amount), 0)", "totalPaid")
        .where("p.id_invoice = :idInvoice AND p.payment_code != 'Remboursement manuel'", { idInvoice: sale.invoice.idInvoice })
        .getRawOne();
      const newBalance = Number(sale.totalAmount) - Number(totalPaid);

      sale.invoice.balanceDue = newBalance;
      if (newBalance <= 0) sale.invoice.status = 0;
      else if (totalPaid > 0) sale.invoice.status = 3;
      else sale.invoice.status = 5;
      await queryRunner.manager.save(Invoice, sale.invoice);

      // 4. Audit log
      const auditLog = new AuditLog();
      auditLog.entityName = "Payment";
      auditLog.entityId = sale.invoice.idInvoice;
      auditLog.action = "REFUND_PAYMENT";
      auditLog.oldValue = null;
      auditLog.newValue = { amount, idPaymentMethod };
      auditLog.idUser = userId;
      await queryRunner.manager.save(AuditLog, auditLog);

      await queryRunner.commitTransaction();

      return (await queryRunner.manager.createQueryBuilder(Sale, "sale")
        .leftJoinAndSelect("sale.saler", "saler")
        .leftJoinAndSelect("sale.room", "room")
        .leftJoinAndSelect("sale.saleItems", "saleItems")
        .leftJoinAndSelect("saleItems.menu", "menu")
        .leftJoinAndSelect("sale.invoice", "invoice")
        .leftJoinAndSelect("invoice.payments", "payments")
        .leftJoinAndSelect("payments.cashMovement", "cashMovement")
        .where("sale.id_sale = :idSale", { idSale })
        .getOne()) as Sale;
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
      auditLog.action = "DELETE_SALE";
      auditLog.oldValue = { totalAmount: sale.totalAmount };
      auditLog.newValue = null;
      auditLog.idUser = userId;
      await queryRunner.manager.save(AuditLog, auditLog);

      if (sale.idInvoice) {
        const inv = await queryRunner.manager.findOne(Invoice, { where: { idInvoice: sale.idInvoice } });
        const invoiceNumber = inv?.invoiceNumber || null;

        const payments = await queryRunner.manager.find(Payment, { where: { idInvoice: sale.idInvoice } });
        const needsAdj = payments.some(p => p.idCashMovement);

        if (needsAdj) {
          const adjCat = await getOrCreateCategory(queryRunner, "Ajustement de vente", -5);
          const openJournal = await getOpenJournal(queryRunner);

          if (openJournal) {
            const idEmployee = await resolveEmployeeId(queryRunner, userId);
            for (const p of payments) {
              if (p.idCashMovement) {
                const amount = Number(p.amount);
                if (amount > 0) {
                  await createCashOutflow(
                    queryRunner,
                    amount,
                    `Ajustement suite suppression de la vente (Facture ${invoiceNumber || 'N/A'})`,
                    invoiceNumber,
                    idEmployee,
                    adjCat.idCashMovementCategory,
                    openJournal.idJournal,
                    p.idPaymentMethod
                  );
                } else if (amount < 0) {
                  await createCashInflow(
                    queryRunner,
                    Math.abs(amount),
                    `Ajustement suite suppression de la vente (Facture ${invoiceNumber || 'N/A'})`,
                    invoiceNumber,
                    idEmployee,
                    adjCat.idCashMovementCategory,
                    openJournal.idJournal,
                    p.idPaymentMethod
                  );
                }
              }
            }
          }
        }
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
