import AppDataSource from "../../../database/data-source";
import { SupplierPayment } from "../../../database/Entities/SupplierPayment";
import {
  SupplierPaymentAllocation,
  AllocationType,
} from "../../../database/Entities/SupplierPaymentAllocation";
import { SupplierBalance } from "../../../database/Entities/SupplierBalance";
import { CashJournal } from "../../../database/Entities/CashJournal";
import { CashMovement } from "../../../database/Entities/CashMovement";
import { PaymentMethodBalance } from "../../../database/Entities/PaymentMethodBalance";
import { IsNull, In } from "typeorm";
import { ProductDelivery } from "../../../database/Entities/ProductDelivery";
import { Purchase } from "../../../database/Entities/Purchase";
import { Supplier } from "../../../database/Entities/Supplier";
import { NotFoundError, BadRequestError } from "../../../shared/errors/AppError";
import {
  CreateSupplierPaymentDto,
  AllocationDto,
  DeliveryPaymentSummary,
  AvailableDestinations,
} from "../types/supplier-payment.type";

export class SupplierPaymentService {
  async createPayment(
    idSupplier: string,
    idEmployee: string,
    dto: CreateSupplierPaymentDto,
  ): Promise<SupplierPayment> {
    if (dto.amount <= 0) throw new BadRequestError("Le montant doit être positif.");
    if (!dto.allocations || dto.allocations.length === 0) {
      throw new BadRequestError("Au moins une allocation est requise.");
    }

    const supplier = await Supplier.findOne({ where: { idSupplier } });
    if (!supplier) throw new NotFoundError("Fournisseur introuvable.");
    const totalAllocated = dto.allocations.reduce((sum, a) => sum + a.amount, 0);
    if (Math.abs(totalAllocated - dto.amount) > 0.01) {
      throw new BadRequestError(
        `La somme des allocations (${totalAllocated}) doit être égale au montant du paiement (${dto.amount}).`,
      );
    }
    const errors = await this.validateAllocations(dto.allocations);
    if (errors.length > 0) {
      throw new BadRequestError(errors.join(" | "));
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const count = await queryRunner.manager.count(SupplierPayment);
      const ref = "PAY-" + String(count + 1).padStart(4, "0");

      const payment = queryRunner.manager.create(SupplierPayment, {
        idSupplier,
        idProcessedBy: idEmployee,
        idPaymentMethod: dto.idPaymentMethod,
        amount: dto.amount,
        paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
        notes: dto.notes ?? null,
        ref,
      });
      await queryRunner.manager.save(SupplierPayment, payment);
      if (dto.idPaymentMethod) {
        const activeJournal = await queryRunner.manager.findOne(CashJournal, {
          where: { journalClosing: IsNull() },
          order: { journalOpening: "DESC" },
        });

        if (activeJournal) {
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

          if (Number(pmb.amount) < dto.amount) {
            throw new BadRequestError(
              `Solde insuffisant pour ce mode de paiement. Disponible : ${Number(pmb.amount).toFixed(2)}, Requis : ${dto.amount.toFixed(2)}.`
            );
          }

          pmb.amount = Number(pmb.amount) - dto.amount;
          await queryRunner.manager.save(PaymentMethodBalance, pmb);
          const { totalExpected } = await queryRunner.manager
            .createQueryBuilder(PaymentMethodBalance, "pmb")
            .select("SUM(pmb.amount)", "totalExpected")
            .where("pmb.id_journal = :idJournal", { idJournal: activeJournal.idJournal })
            .getRawOne();

          activeJournal.expectedClosingBalance = Number(totalExpected || 0);
          await queryRunner.manager.save(CashJournal, activeJournal);
          const movementCount = await queryRunner.manager.count(CashMovement);
          const mvmtRef = "CM-" + String(movementCount + 1).padStart(4, "0");
          const cashMovement = queryRunner.manager.create(CashMovement, {
            ref: mvmtRef,
            amount: dto.amount,
            movementDate: payment.paymentDate,
            reason: dto.notes || "Paiement fournisseur " + ref,
            invoiceReference: ref,
            direction: -5,
            idProcessedBy: idEmployee,
            idJournal: activeJournal.idJournal,
            idPaymentMethod: dto.idPaymentMethod,
            status: 0,
          });
          await queryRunner.manager.save(CashMovement, cashMovement);
        }
      }

      for (const allocDto of dto.allocations) {
        if (allocDto.amount <= 0) continue;

        const allocation = queryRunner.manager.create(SupplierPaymentAllocation, {
          idSupplierPayment: payment.idSupplierPayment,
          allocationType: allocDto.allocationType,
          idDelivery: allocDto.idDelivery ?? null,

          amount: allocDto.amount,
        });
        await queryRunner.manager.save(SupplierPaymentAllocation, allocation);

        if (allocDto.allocationType === "DELIVERY" && allocDto.idDelivery) {
          const delivery = await queryRunner.manager.findOne(ProductDelivery, {
            where: { idDelivery: allocDto.idDelivery },
          });
          if (delivery) {
            delivery.balanceDue = Math.max(0, Number(delivery.balanceDue) - allocDto.amount);
            await queryRunner.manager.save(ProductDelivery, delivery);
          }
        }
      }

      await this.syncSupplierBalance(idSupplier, queryRunner.manager);
      await queryRunner.commitTransaction();
      return payment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  async getDeliveryPaymentSummary(idDelivery: string): Promise<DeliveryPaymentSummary> {
    const delivery = await ProductDelivery.findOne({
      where: { idDelivery },
      relations: { purchaseDeliveries: true },
    });
    if (!delivery) throw new NotFoundError("Livraison introuvable.");
    const firstAlloc = await SupplierPaymentAllocation.findOne({
      where: { idDelivery, allocationType: "DELIVERY" as AllocationType },
      relations: { supplierPayment: { supplier: true } },
    });
    const idSupplier = firstAlloc?.supplierPayment?.idSupplier ?? "";

    const supplierCredit = await this.getSupplierNetBalance(idSupplier);

    let balanceDue = Number(delivery.balanceDue ?? delivery.totalAmount ?? 0);

    const totalAmount = Number(delivery.totalAmount ?? 0);
    const totalPaid = totalAmount - balanceDue;

    let paymentStatus: "UNPAID" | "PARTIAL" | "PAID" = "UNPAID";
    if (balanceDue <= 0) paymentStatus = "PAID";
    else if (totalPaid > 0) paymentStatus = "PARTIAL";
    const deliveryAllocations = await SupplierPaymentAllocation.find({
      where: { idDelivery, allocationType: "DELIVERY" as AllocationType },
      relations: { supplierPayment: { paymentMethod: true } },
    });

    const activeJournal = await CashJournal.findOne({
      where: { journalClosing: IsNull() },
      order: { journalOpening: "DESC" },
    });
    const methodBalances = new Map<string, number>();
    if (activeJournal) {
      const pmbs = await PaymentMethodBalance.find({
        where: { idJournal: activeJournal.idJournal },
      });
      for (const pmb of pmbs) {
        methodBalances.set(pmb.idPaymentMethod, Number(pmb.amount));
      }
    }

    const allocations = [...deliveryAllocations];
    const payments = allocations.map((a) => {
      const idPaymentMethod = a.supplierPayment?.idPaymentMethod;
      return {
        idPayment: a.supplierPayment?.idSupplierPayment ?? "",
        ref: a.supplierPayment?.ref ?? "",
        date: a.supplierPayment?.paymentDate ?? new Date(),
        amount: Number(a.amount),
        method: a.supplierPayment?.paymentMethod?.label ?? "Inconnu",
        methodBalance: idPaymentMethod ? (methodBalances.get(idPaymentMethod) ?? 0) : 0,
      };
    });

    return {
      idDelivery,
      ref: delivery.ref,
      totalAmount,
      totalPaid,
      balanceDue,
      paymentStatus,
      idSupplier,
      supplierCredit,
      payments,
    };
  }
  async getAvailableDestinations(idSupplier: string): Promise<AvailableDestinations> {
    const deliveries = await AppDataSource.getRepository(ProductDelivery)
      .createQueryBuilder("d")
      .innerJoin("d.purchaseDeliveries", "pd")
      .innerJoin("pd.purchase", "p")
      .where("p.id_supplier = :idSupplier", { idSupplier })
      .andWhere("d.status = 0")
      .andWhere("d.balance_due > 0")
      .select(["d.idDelivery", "d.ref", "d.deliveryDate", "d.balanceDue"])
      .orderBy("d.deliveryDate", "DESC")
      .getMany();

    const unvalidatedDeliveriesCount = await AppDataSource.getRepository(ProductDelivery)
      .createQueryBuilder("d")
      .innerJoin("d.purchaseDeliveries", "pd")
      .innerJoin("pd.purchase", "p")
      .where("p.id_supplier = :idSupplier", { idSupplier })
      .andWhere("d.status = 5")
      .getCount();

    return {
      deliveries: deliveries.map((d) => ({
        idDelivery: d.idDelivery,
        ref: d.ref,
        deliveryDate: d.deliveryDate,
        balanceDue: Number(d.balanceDue),
      })),
      unvalidatedDeliveriesCount,
      purchases: [],
    };
  }
  async getPurchaseTotalPaid(idPurchase: string, excludePaymentId?: string): Promise<number> {
    const qb = AppDataSource.getRepository(SupplierPaymentAllocation)
      .createQueryBuilder("spa")
      .select("COALESCE(SUM(spa.amount), 0)", "total")
      .innerJoin("purchase_delivery", "pd", "pd.id_delivery = spa.id_delivery")
      .where("pd.id_purchase = :id", { id: idPurchase })
      .andWhere("spa.allocation_type = 'DELIVERY'");

    if (excludePaymentId) {
      qb.andWhere("spa.id_supplier_payment != :excludePaymentId", { excludePaymentId });
    }
    const result = (await qb.getRawOne()) as { total: string };
    const deliveryPaid = Number(result.total);

    return deliveryPaid;
  }
  async getSupplierNetBalance(idSupplier: string): Promise<number> {
    const row = await SupplierBalance.findOne({ where: { idSupplier } });
    if (!row) return 0;
    return Math.max(0, Number(row.credit) - Number(row.debit));
  }

  async getSupplierBalance(idSupplier: string): Promise<number> {
    return this.getSupplierNetBalance(idSupplier);
  }

  async getSupplierBalanceRow(
    idSupplier: string,
  ): Promise<{ credit: number; debit: number; balance: number }> {
    const row = await SupplierBalance.findOne({ where: { idSupplier } });
    if (!row) return { credit: 0, debit: 0, balance: 0 };
    const credit = Number(row.credit);
    const debit = Number(row.debit);
    return { credit, debit, balance: credit - debit };
  }
  private async validateAllocations(
    allocations: AllocationDto[],
    excludePaymentId?: string,
  ): Promise<string[]> {
    const errors: string[] = [];
    const deliveryAmounts = new Map<string, number>();
    const purchaseAmounts = new Map<string, number>();

    for (const alloc of allocations) {
      if (alloc.amount <= 0) {
        errors.push(`Montant invalide pour l'allocation (${alloc.allocationType}).`);
      }

      if (alloc.allocationType === "DELIVERY") {
        if (!alloc.idDelivery) {
          errors.push("Une allocation DELIVERY doit avoir un id_delivery.");
        } else {
          deliveryAmounts.set(
            alloc.idDelivery,
            (deliveryAmounts.get(alloc.idDelivery) ?? 0) + alloc.amount,
          );
        }
      }
    }

    return errors;
  }
  async getPaymentById(idPayment: string) {
    const payment = await SupplierPayment.findOne({
      where: { idSupplierPayment: idPayment },
      relations: {
        allocations: true,
        paymentMethod: true,
      },
    });

    if (!payment) throw new NotFoundError("Paiement introuvable.");

    return payment;
  }
  async updatePayment(
    idPayment: string,
    idEmployee: string,
    dto: CreateSupplierPaymentDto,
  ): Promise<SupplierPayment> {
    if (dto.amount <= 0) throw new BadRequestError("Le montant doit être positif.");
    if (!dto.allocations || dto.allocations.length === 0) {
      throw new BadRequestError("Au moins une allocation est requise.");
    }

    const payment = await SupplierPayment.findOne({
      where: { idSupplierPayment: idPayment },
      relations: { allocations: true },
    });
    if (!payment) throw new NotFoundError("Paiement introuvable.");

    const idSupplier = payment.idSupplier;
    const totalAllocated = dto.allocations.reduce((sum, a) => sum + a.amount, 0);
    if (Math.abs(totalAllocated - dto.amount) > 0.01) {
      throw new BadRequestError(
        `La somme des allocations (${totalAllocated}) doit être égale au montant du paiement (${dto.amount}).`,
      );
    }
    const errors = await this.validateAllocations(dto.allocations, idPayment);
    if (errors.length > 0) {
      throw new BadRequestError(errors.join(" | "));
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const oldAmount = Number(payment.amount);
      const amountDiff = dto.amount - oldAmount;
      const oldMethodId = payment.idPaymentMethod;
      payment.amount = dto.amount;
      payment.idPaymentMethod = dto.idPaymentMethod;
      payment.paymentDate = dto.paymentDate ? new Date(dto.paymentDate) : payment.paymentDate;
      payment.notes = dto.notes ?? payment.notes;
      payment.idProcessedBy = idEmployee;
      await queryRunner.manager.save(SupplierPayment, payment);
      if (amountDiff !== 0) {
        let balance = await queryRunner.manager.findOne(SupplierBalance, { where: { idSupplier } });
        if (balance) {
          balance.credit = Number(balance.credit) + amountDiff;
          await queryRunner.manager.save(SupplierBalance, balance);
        }
      }
      const activeJournal = await queryRunner.manager.findOne(CashJournal, {
        where: { journalClosing: IsNull() },
        order: { journalOpening: "DESC" },
      });

      if (activeJournal) {
        if (oldMethodId) {
          let oldPmb = await queryRunner.manager.findOne(PaymentMethodBalance, {
            where: { idJournal: activeJournal.idJournal, idPaymentMethod: oldMethodId },
          });
          if (oldPmb) {
            oldPmb.amount = Number(oldPmb.amount) + oldAmount;
            await queryRunner.manager.save(PaymentMethodBalance, oldPmb);
          }
        }
        if (dto.idPaymentMethod) {
          let newPmb = await queryRunner.manager.findOne(PaymentMethodBalance, {
            where: { idJournal: activeJournal.idJournal, idPaymentMethod: dto.idPaymentMethod },
          });
          if (!newPmb) {
            newPmb = queryRunner.manager.create(PaymentMethodBalance, {
              idJournal: activeJournal.idJournal,
              idPaymentMethod: dto.idPaymentMethod,
              amount: 0,
            });
          }
          newPmb.amount = Number(newPmb.amount) - dto.amount;
          await queryRunner.manager.save(PaymentMethodBalance, newPmb);
        }
        const { totalExpected } = await queryRunner.manager
          .createQueryBuilder(PaymentMethodBalance, "pmb")
          .select("SUM(pmb.amount)", "totalExpected")
          .where("pmb.id_journal = :idJournal", { idJournal: activeJournal.idJournal })
          .getRawOne();
        activeJournal.expectedClosingBalance = Number(totalExpected || 0);
        await queryRunner.manager.save(CashJournal, activeJournal);
        const refundMove = queryRunner.manager.create(CashMovement, {
          idJournal: activeJournal.idJournal,
          idPaymentMethod: oldMethodId,
          type: "IN",
          amount: oldAmount,
          description: `Annulation du paiement ${payment.ref} pour modification`,
          idProcessedBy: idEmployee,
        });
        await queryRunner.manager.save(CashMovement, refundMove);

        const newMove = queryRunner.manager.create(CashMovement, {
          idJournal: activeJournal.idJournal,
          idPaymentMethod: dto.idPaymentMethod,
          type: "OUT",
          amount: dto.amount,
          description: `Nouveau montant pour le paiement ${payment.ref} modifié`,
          idProcessedBy: idEmployee,
        });
        await queryRunner.manager.save(CashMovement, newMove);
      }
      await queryRunner.manager.delete(SupplierPaymentAllocation, { idSupplierPayment: idPayment });
      const deliveryDeltas = new Map<string, number>();
      const purchaseDeltas = new Map<string, number>();

      for (const alloc of dto.allocations) {
        if (alloc.amount <= 0) continue;

        const newAlloc = queryRunner.manager.create(SupplierPaymentAllocation, {
          idSupplierPayment: payment.idSupplierPayment,

          idDelivery: alloc.idDelivery ?? null,
          allocationType: alloc.allocationType as AllocationType,
          amount: alloc.amount,
        });
        await queryRunner.manager.save(SupplierPaymentAllocation, newAlloc);

        if (alloc.idDelivery && alloc.allocationType === "DELIVERY") {
          deliveryDeltas.set(
            alloc.idDelivery,
            (deliveryDeltas.get(alloc.idDelivery) || 0) + alloc.amount,
          );
        }
      }
      for (const old of payment.allocations) {
        if (old.allocationType === "DELIVERY" && old.idDelivery) {
          deliveryDeltas.set(
            old.idDelivery,
            (deliveryDeltas.get(old.idDelivery) || 0) - Number(old.amount),
          );
        }
      }
      for (const [idDeliv, delta] of deliveryDeltas) {
        if (delta !== 0) {
          const d = await queryRunner.manager.findOne(ProductDelivery, {
            where: { idDelivery: idDeliv },
          });
          if (d) {
            d.balanceDue = Number(d.balanceDue) - delta;
            await queryRunner.manager.save(ProductDelivery, d);
          }
        }
      }

      await this.syncSupplierBalance(idSupplier, queryRunner.manager);
      await queryRunner.commitTransaction();
      return payment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getPurchasePaymentSummary(idPurchase: string) {
    const purchase = await AppDataSource.getRepository(Purchase).findOne({
      where: { idPurchase },
      relations: { supplier: true },
    });
    if (!purchase) throw new NotFoundError("Commande introuvable.");

    const pds = await AppDataSource.manager.query(
      "SELECT id_delivery FROM purchase_delivery WHERE id_purchase = $1",
      [idPurchase],
    );
    const deliveryIds = pds.map((pd: any) => pd.id_delivery);

    let deliveryAllocations: any[] = [];
    if (deliveryIds.length > 0) {
      deliveryAllocations = await AppDataSource.getRepository(SupplierPaymentAllocation).find({
        where: { idDelivery: In(deliveryIds), allocationType: "DELIVERY" },
        relations: { supplierPayment: { paymentMethod: true }, delivery: true },
      });
    }

    const activeJournal = await CashJournal.findOne({
      where: { journalClosing: IsNull() },
      order: { journalOpening: "DESC" },
    });
    const methodBalances = new Map<string, number>();
    if (activeJournal) {
      const pmbs = await PaymentMethodBalance.find({
        where: { idJournal: activeJournal.idJournal },
      });
      for (const pmb of pmbs) {
        methodBalances.set(pmb.idPaymentMethod, Number(pmb.amount));
      }
    }

    const allocations = [...deliveryAllocations];
    const payments = allocations.map((a) => {
      const idPaymentMethod = a.supplierPayment?.idPaymentMethod;
      return {
        idPayment: a.supplierPayment?.idSupplierPayment ?? "",
        ref: a.supplierPayment?.ref ?? "",
        date: a.supplierPayment?.paymentDate ?? new Date(),
        amount: Number(a.amount),
        method: a.supplierPayment?.paymentMethod?.label ?? "Inconnu",
        methodBalance: idPaymentMethod ? (methodBalances.get(idPaymentMethod) ?? 0) : 0,
      };
    });
    const advanceAmount = allocations.reduce((sum, a) => sum + Number(a.amount), 0);
    const totalAmount = Number(purchase.totalAmount ?? 0);
    const balanceDue = Math.max(0, totalAmount - advanceAmount);

    return {
      idPurchase,
      ref: purchase.ref,
      totalAmount,
      advanceAmount,
      balanceDue,
      idSupplier: purchase.idSupplier,
      supplierName: purchase.supplier?.name || "",
      payments,
    };
  }
  async applySupplierCredit(
    idSupplier: string,
    dto: { idDelivery?: string; amount?: number },
  ): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const creditAllocations = await queryRunner.manager.find(SupplierPaymentAllocation, {
        where: { allocationType: "SUPPLIER_CREDIT", supplierPayment: { idSupplier } },
        relations: { supplierPayment: true },
        order: { supplierPayment: { paymentDate: "ASC" } },
      });

      if (creditAllocations.length === 0) {
        throw new BadRequestError("Aucun crédit disponible pour ce fournisseur.");
      }

      let amountToApply =
        dto.amount ?? creditAllocations.reduce((sum: any, a: any) => sum + Number(a.amount), 0);
      let remainingToApply = amountToApply;
      let destinations: Array<{ type: "DELIVERY"; idDelivery?: string; amount: number }> = [];

      if (dto.idDelivery) {
        const delivery = await queryRunner.manager.findOne(ProductDelivery, {
          where: { idDelivery: dto.idDelivery },
        });
        if (!delivery) throw new NotFoundError("Livraison introuvable.");
        if (delivery.status !== 0) throw new BadRequestError("La livraison n'est pas validée.");
        const maxToApply = Math.min(remainingToApply, Number(delivery.balanceDue));
        if (maxToApply > 0) {
          destinations.push({
            type: "DELIVERY",
            idDelivery: delivery.idDelivery,
            amount: maxToApply,
          });
          delivery.balanceDue = Math.max(0, Number(delivery.balanceDue) - maxToApply);
          await queryRunner.manager.save(ProductDelivery, delivery);

          remainingToApply -= maxToApply;
        }
      } else {
        const deliveries = await queryRunner.manager
          .createQueryBuilder(ProductDelivery, "d")
          .innerJoin("d.purchaseDeliveries", "pd")
          .innerJoin("pd.purchase", "p")
          .where("p.id_supplier = :idSupplier", { idSupplier })
          .andWhere("d.status = 0")
          .andWhere("d.balance_due > 0")
          .orderBy("d.deliveryDate", "DESC")
          .getMany();

        for (const d of deliveries) {
          if (remainingToApply <= 0) break;
          const maxToApply = Math.min(remainingToApply, Number(d.balanceDue));
          if (maxToApply > 0) {
            destinations.push({ type: "DELIVERY", idDelivery: d.idDelivery, amount: maxToApply });
            d.balanceDue = Math.max(0, Number(d.balanceDue) - maxToApply);
            await queryRunner.manager.save(ProductDelivery, d);

            remainingToApply -= maxToApply;
          }
        }
      }

      let totalEffectivelyApplied = amountToApply - remainingToApply;
      if (totalEffectivelyApplied <= 0) {
        throw new BadRequestError("Aucune dette ouverte trouvée pour appliquer ce crédit.");
      }
      let appliedDestinationsIndex = 0;
      let amountToTakeFromDest = destinations[0]?.amount ?? 0;
      let amountToTakeFromAlloc = totalEffectivelyApplied;

      for (const alloc of creditAllocations) {
        if (totalEffectivelyApplied <= 0) break;

        const allocAmount = Number(alloc.amount);
        const take = Math.min(allocAmount, totalEffectivelyApplied);
        let takeRemaining = take;
        while (takeRemaining > 0 && appliedDestinationsIndex < destinations.length) {
          const dest = destinations[appliedDestinationsIndex];
          if (!dest) break;
          const toApplyToDest = Math.min(takeRemaining, amountToTakeFromDest);
          const newAlloc = queryRunner.manager.create(SupplierPaymentAllocation, {
            idSupplierPayment: alloc.idSupplierPayment,
            allocationType: dest.type,
            idDelivery: dest.idDelivery ?? null,
            amount: toApplyToDest,
          });
          await queryRunner.manager.save(SupplierPaymentAllocation, newAlloc);
          alloc.amount = Number(alloc.amount) - toApplyToDest;
          if (alloc.amount <= 0) {
            await queryRunner.manager.remove(SupplierPaymentAllocation, alloc);
          } else {
            await queryRunner.manager.save(SupplierPaymentAllocation, alloc);
          }

          takeRemaining -= toApplyToDest;
          amountToTakeFromDest -= toApplyToDest;
          totalEffectivelyApplied -= toApplyToDest;

          if (amountToTakeFromDest <= 0) {
            appliedDestinationsIndex++;
            if (appliedDestinationsIndex < destinations.length) {
              amountToTakeFromDest = destinations[appliedDestinationsIndex]?.amount ?? 0;
            }
          }
        }
      }

      await this.syncSupplierBalance(idSupplier, queryRunner.manager);
        await queryRunner.commitTransaction();
      } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
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

    let balance = await manager.findOne("SupplierBalance", { where: { idSupplier } });
    if (!balance) {
      balance = manager.create("SupplierBalance", { idSupplier });
    }
    balance.debit = debit;
    balance.credit = credit;
    await manager.save("SupplierBalance", balance);
  }
}
