import AppDataSource from "../../../database/data-source";
import { Payment } from "../../../database/Entities/Payment";
import { Sale } from "../../../database/Entities/Sale";
import { Room } from "../../../database/Entities/Room";
import { SaleItem } from "../../../database/Entities/SaleItem";
import { MenuItem } from "../../../database/Entities/MenuItem";
import { SuppliedItem } from "../../../database/Entities/SuppliedItem";
import { SupplierProduct } from "../../../database/Entities/SupplierProduct";

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
      qb.andWhere("DATE(sale.sale_date) = :date", { date: options.date });
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
      const dateStr = (sale.saleDate instanceof Date 
        ? sale.saleDate.toISOString().split("T")[0] 
        : new Date(sale.saleDate).toISOString().split("T")[0]) as string;
      
      if (!groupedData[dateStr]) {
        groupedData[dateStr] = { date: dateStr, totaldelajournee: 0, liste: [] };
      }
      
      const payments = sale.invoice?.payments || [];
      payments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
      const lastPayment = payments[0];
      
      const amount = Number(sale.totalAmount);
      groupedData[dateStr].totaldelajournee += amount;
      
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
        payments: payments.map(p => ({
          idPayment: p.idPayment,
          paymentDate: p.paymentDate,
          amount: Number(p.amount),
          paymentCode: p.paymentCode || null,
          paymentMethod: p.paymentMethod?.label || null,
          ref: p.ref
        }))
      });
    }

    const groupedArray = Object.values(groupedData).sort((a, b) => b.date.localeCompare(a.date));

    return {
      data: groupedArray,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
}
