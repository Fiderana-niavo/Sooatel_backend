import AppDataSource from "../../../database/data-source";
import { Sale } from "../../../database/Entities/Sale";
import { MenuItem } from "../../../database/Entities/MenuItem";
import { SuppliedItem } from "../../../database/Entities/SuppliedItem";
import { SupplierProduct } from "../../../database/Entities/SupplierProduct";
import { CashJournal } from "../../../database/Entities/CashJournal";
import { CashMovement } from "../../../database/Entities/CashMovement";
import { PaymentMethodBalance } from "../../../database/Entities/PaymentMethodBalance";
import { IsNull, LessThan } from "typeorm";


export interface RevenueFilters {
  page?: number;
  limit?: number;
  date?: string;
  idMenu?: string;
  idSupplier?: string;
}

export class RevenueService {
  async getRevenue(options: RevenueFilters) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const qb = AppDataSource.getRepository(Sale).createQueryBuilder("sale")
      .innerJoinAndSelect("sale.invoice", "invoice")
      .innerJoinAndSelect("invoice.payments", "payment")
      .leftJoinAndSelect("sale.room", "room")
      .leftJoinAndSelect("payment.paymentMethod", "paymentMethod");

    if (options.date) {
      if (options.date.length === 7) {
        qb.andWhere("TO_CHAR(sale.sale_date, 'YYYY-MM') = :date", { date: options.date });
      } else {
        qb.andWhere("DATE(sale.sale_date) = :date", { date: options.date });
      }
    }

    qb.andWhere("sale.total_amount > 0");

    if (options.idMenu || options.idSupplier) {
      qb.innerJoin("sale.saleItems", "si");

      if (options.idMenu) {
        qb.andWhere("si.id_menu = :idMenu", { idMenu: options.idMenu });
      }

      if (options.idSupplier) {
        qb.innerJoin(MenuItem, "mi", "mi.id_menu = si.id_menu");
        qb.innerJoin(SuppliedItem, "sui", "sui.id_item = mi.id_item");
        qb.innerJoin(SupplierProduct, "sp", "sp.id_supplier_product = sui.id_supplier_product");
        qb.andWhere("sp.id_supplier = :idSupplier", { idSupplier: options.idSupplier });
      }
    }

    qb.orderBy("sale.sale_date", "DESC");
    qb.addOrderBy("sale.created_at", "DESC");

    qb.skip(skip).take(limit);

    const [sales, total] = await qb.getManyAndCount();

    const groupedData: Record<string, { date: string, totaldelajournee: number, liste: any[] }> = {};

    for (const sale of sales) {
      const d = sale.saleDate instanceof Date ? sale.saleDate : new Date(sale.saleDate);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      if (!groupedData[dateStr]) {
        groupedData[dateStr] = { date: dateStr, totaldelajournee: 0, liste: [] };
      }

      const payments = sale.invoice?.payments || [];
      payments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
      const lastPayment = payments[0];

      const amount = Number(sale.totalAmount);
      groupedData[dateStr].totaldelajournee += amount;

      const mappedPayments = [];
      for (const p of payments) {
        mappedPayments.push({
          idPayment: p.idPayment,
          paymentDate: p.paymentDate,
          amount: Number(p.amount),
          paymentCode: p.paymentCode || null,
          paymentMethod: p.paymentMethod?.label || null,
          ref: p.ref
        });
      }

      groupedData[dateStr].liste.push({
        idSale: sale.idSale,
        saleDate: sale.saleDate,
        amount: amount,
        paymentCode: lastPayment?.paymentCode || null,
        invoiceNumber: sale.invoice?.invoiceNumber || sale.invoice?.invoiceNumberSystem || sale.ref || null,
        tableNumber: sale.tableNumber,
        chargeToRoom: sale.chargeToRoom,
        roomNumber: sale.room?.roomNumber,
        paymentMethod: lastPayment?.paymentMethod?.label || null,
        payments: mappedPayments
      });
    }

    const groupedArray = Object.values(groupedData).sort((a, b) => b.date.localeCompare(a.date));

    const isNotJournalised = sales.some(sale =>
      sale.invoice?.payments?.some(p => p.idCashMovement === null)
    );

    return {
      data: groupedArray,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      isNotJournalised

    };
  }

  async journalizeSales(idProcessedBy: string) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Get active cash journal
      const activeJournal = await queryRunner.manager.findOne(CashJournal, {
        where: { journalClosing: IsNull() }
      });

      if (!activeJournal) {
        throw new Error("Aucun journal de caisse ouvert.");
      }

      const paymentRows: { id_payment: string; id_payment_method: string; amount: string | number }[] = await queryRunner.query(`
        SELECT p.id_payment, p.id_payment_method, p.amount
        FROM payment p
        WHERE p.id_cash_movement IS NULL
        FOR UPDATE SKIP LOCKED
      `);

      if (paymentRows.length === 0) {
        throw new Error("Aucun paiement à journaliser.");
      }

      const paymentsByMethod = new Map<string, string[]>();
      const groupedPaymentsMap = new Map<string, number>();

      for (const row of paymentRows) {
        const pMethod = row.id_payment_method;
        const amt = Number(row.amount);
        
        // Group amounts
        groupedPaymentsMap.set(pMethod, (groupedPaymentsMap.get(pMethod) || 0) + amt);
        
        // Group ids
        const list = paymentsByMethod.get(pMethod) ?? [];
        list.push(row.id_payment);
        paymentsByMethod.set(pMethod, list);
      }

      const today = new Date();
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

      const movementValues = [];
      for (const [idPaymentMethod, total] of groupedPaymentsMap.entries()) {
        movementValues.push({
          ref: `MVT-${dateStr}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          amount: Number(total),
          movementDate: today,
          reason: "Journalisation des ventes",
          direction: 5,
          idProcessedBy,
          idJournal: activeJournal.idJournal,
          status: 5,
          idPaymentMethod
        });
      }

      const insertedMovements: { id_cash_movement: string; id_payment_method: string }[] = await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(CashMovement)
        .values(movementValues)
        .returning(["idCashMovement", "idPaymentMethod"])
        .execute()
        .then(r => r.raw);

      for (const movement of insertedMovements) {
        const pMethodId = movement.id_payment_method || (movement as any).idPaymentMethod;
        const cMovementId = movement.id_cash_movement || (movement as any).idCashMovement;
        
        const ids = paymentsByMethod.get(pMethodId) ?? [];
        if (ids.length > 0) {
          await queryRunner.query(
            `UPDATE payment SET id_cash_movement = $1 WHERE id_payment = ANY($2)`,
            [cMovementId, ids]
          );
        }
      }

      const previousJournal = await queryRunner.manager.findOne(CashJournal, {
        where: { journalOpening: LessThan(activeJournal.journalOpening) },
        order: { journalOpening: "DESC" }
      });

      const balanceRows: { idPaymentMethod: string; movementSum: string; prevAmount: string }[] = await queryRunner.query(`
        SELECT
          pm.id_payment_method AS "idPaymentMethod",
          COALESCE((
            SELECT SUM(cm.amount * (cm.direction / 5))
            FROM cash_movement cm
            WHERE cm.id_journal = $1 AND cm.id_payment_method = pm.id_payment_method
          ), 0) AS "movementSum",
          COALESCE((
            SELECT pmb.amount
            FROM payment_method_balance pmb
            WHERE pmb.id_journal = $2 AND pmb.id_payment_method = pm.id_payment_method
          ), 0) AS "prevAmount"
        FROM payment_method pm
      `, [activeJournal.idJournal, previousJournal?.idJournal ?? null]);

      if (balanceRows.length > 0) {
        const upsertValues = [];
        for (const row of balanceRows) {
          upsertValues.push({
            idJournal: activeJournal.idJournal,
            idPaymentMethod: row.idPaymentMethod,
            amount: Number(row.prevAmount) + Number(row.movementSum)
          });
        }

        await queryRunner.manager
          .createQueryBuilder()
          .insert()
          .into(PaymentMethodBalance)
          .values(upsertValues)
          .orUpdate(["amount"], ["id_journal", "id_payment_method"])
          .execute();
      }

      const { totalExpected } = await queryRunner.manager
        .createQueryBuilder(PaymentMethodBalance, "pmb")
        .select("SUM(pmb.amount)", "totalExpected")
        .where("pmb.id_journal = :idJournal", { idJournal: activeJournal.idJournal })
        .getRawOne();

      await queryRunner.manager.update(CashJournal, activeJournal.idJournal, {
        expectedClosingBalance: Number(totalExpected || 0)
      });

      await queryRunner.commitTransaction();
      return { success: true, message: "Les ventes ont été journalisées avec succès." };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
