import AppDataSource from "../../../database/data-source";
import { Invoice } from "../../../database/Entities/Invoice";
import { Payment } from "../../../database/Entities/Payment";
import { AuditLog } from "../../../database/Entities/AuditLog";
import { NotFoundError, BadRequestError } from "../../../shared/errors/AppError";
import { CreatePaymentDto } from "../types/payment.type";

export class PaymentService {
  async payInvoice(idInvoice: string, userId: string, paymentDto: CreatePaymentDto): Promise<Invoice> {
    if (paymentDto.amount < 0) {
      throw new BadRequestError("Le montant du paiement ne peut pas être négatif.");
    }
    
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      const invoice = await queryRunner.manager.createQueryBuilder(Invoice, "invoice")
        .setLock("pessimistic_write")
        .where("invoice.id_invoice = :idInvoice", { idInvoice })
        .getOne();
        
      if (!invoice) throw new NotFoundError("Facture introuvable");

      const oldValue = { ...invoice };

      const payment = new Payment();
      payment.idInvoice = idInvoice;
      payment.paymentDate = paymentDto.paymentDate ? new Date(paymentDto.paymentDate) : new Date();
      payment.amount = paymentDto.amount;
      payment.idPaymentMethod = paymentDto.idPaymentMethod;
      payment.paymentCode = paymentDto.paymentCode || null;
      await queryRunner.manager.save(Payment, payment);

      const allPayments = await queryRunner.manager.find(Payment, { where: { idInvoice } });
      const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      
      invoice.balanceDue = Math.max(0, Number(invoice.totalAmount) - totalPaid);
      
      if (invoice.balanceDue <= 0) {
        invoice.balanceDue = 0;
        invoice.status = 0;
      } else if (totalPaid > 0) {
        invoice.status = 3;
      } else {
        invoice.status = 5;
      }

      const updated = await queryRunner.manager.save(Invoice, invoice);

      const auditLog = new AuditLog();
      auditLog.entityName = "Invoice";
      auditLog.entityId = idInvoice;
      auditLog.action = "PAYMENT";
      auditLog.oldValue = { balanceDue: oldValue.balanceDue, status: oldValue.status };
      auditLog.newValue = { balanceDue: updated.balanceDue, status: updated.status, payment: payment.idPayment };
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
}
