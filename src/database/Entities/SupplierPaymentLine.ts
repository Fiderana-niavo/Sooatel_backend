import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { SupplierPayment } from "./SupplierPayment";
import { PaymentMethod } from "./PaymentMethod";

@Entity("supplier_payment_line")
export class SupplierPaymentLine extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_payment_line" })
  idPaymentLine: string;

  @Column({ type: "uuid", name: "id_supplier_payment" })
  idSupplierPayment: string;

  @Column({ type: "uuid", name: "id_payment_method" })
  idPaymentMethod: string;

  @Column({ type: "numeric", precision: 15, scale: 2, name: "amount" })
  amount: number;

  @ManyToOne(() => SupplierPayment, (payment) => payment.paymentLines)
  @JoinColumn({ name: "id_supplier_payment" })
  supplierPayment: SupplierPayment;

  @ManyToOne(() => PaymentMethod)
  @JoinColumn({ name: "id_payment_method" })
  paymentMethod: PaymentMethod;
}
