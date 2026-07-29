import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { PaymentMethod } from "./PaymentMethod";
import { Invoice } from "./Invoice";

@Entity("payment")
export class Payment extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_payment" })
  idPayment: string;

  @Column({ type: "varchar", length: 20, unique: true, name: "ref" })
  ref: string;

  @Column({ type: "uuid", name: "id_invoice" })
  idInvoice: string;

  @Column({ type: "date", name: "payment_date" })
  paymentDate: Date;

  @Column({ type: "varchar", length: 50, nullable: true, name: "payment_code" })
  paymentCode: string | null;

  @Column({ type: "numeric", precision: 15, scale: 2, name: "amount" })
  amount: number;

  @Column({ type: "uuid", name: "id_payment_method" })
  idPaymentMethod: string;

  @ManyToOne(() => PaymentMethod)
  @JoinColumn({ name: "id_payment_method" })
  paymentMethod: PaymentMethod;

  @ManyToOne(() => Invoice, (invoice) => invoice.payments)
  @JoinColumn({ name: "id_invoice" })
  invoice: Invoice;
}
