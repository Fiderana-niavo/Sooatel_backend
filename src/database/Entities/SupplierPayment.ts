import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Employee } from "./Employee";
import { PaymentMethod } from "./PaymentMethod";
import { SupplierInvoice } from "./SupplierInvoice";

@Entity("supplier_payment")
export class SupplierPayment extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_supplier_payment" })
  idSupplierPayment: string;

  @Column({ type: "varchar", length: 20, unique: true, name: "ref" })
  ref: string;

  @Column({ type: "uuid", name: "id_supplier_invoice" })
  idSupplierInvoice: string;

  @Column({ type: "date", name: "payment_date" })
  paymentDate: Date;

  @Column({ type: "numeric", precision: 15, scale: 2, nullable: true, name: "amount" })
  amount: number;

  @Column({ type: "uuid", name: "id_processed_by" })
  idProcessedBy: string;

  @Column({ type: "uuid", name: "id_payment_method" })
  idPaymentMethod: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: "id_processed_by" })
  processedBy: Employee;

  @ManyToOne(() => PaymentMethod)
  @JoinColumn({ name: "id_payment_method" })
  paymentMethod: PaymentMethod;

  @ManyToOne(() => SupplierInvoice, (invoice) => invoice.supplierPayments)
  @JoinColumn({ name: "id_supplier_invoice" })
  supplierInvoice: SupplierInvoice;
}
