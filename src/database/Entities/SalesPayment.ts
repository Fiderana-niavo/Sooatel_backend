import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { PaymentMethod } from "./PaymentMethod";
import { Sale } from "./Sale";

@Entity("sales_payment")
export class SalesPayment extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_sale_payment" })
  idSalePayment: string;

  @Column({ type: "varchar", length: 20, unique: true, name: "ref" })
  ref: string;

  @Column({ type: "uuid", name: "id_sale" })
  idSale: string;

  @Column({ type: "date", name: "payment_date" })
  paymentDate: Date;

  @Column({ type: "numeric", precision: 15, scale: 2, name: "amount" })
  amount: number;

  @Column({ type: "uuid", name: "id_payment_method" })
  idPaymentMethod: string;

  @ManyToOne(() => PaymentMethod)
  @JoinColumn({ name: "id_payment_method" })
  paymentMethod: PaymentMethod;

  @ManyToOne(() => Sale)
  @JoinColumn({ name: "id_sale" })
  sale: Sale;
}
