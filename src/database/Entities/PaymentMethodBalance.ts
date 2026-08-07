import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { CashJournal } from "./CashJournal";
import { PaymentMethod } from "./PaymentMethod";

@Entity("payment_method_balance")
export class PaymentMethodBalance extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_payment_method_balance" })
  idPaymentMethodBalance: string;

  @Column({ type: "uuid", name: "id_journal" })
  idJournal: string;

  @Column({ type: "uuid", name: "id_payment_method" })
  idPaymentMethod: string;

  @Column({ type: "numeric", precision: 15, scale: 2, name: "amount", default: 0 })
  amount: number;

  @ManyToOne(() => CashJournal)
  @JoinColumn({ name: "id_journal" })
  journal: CashJournal;

  @ManyToOne(() => PaymentMethod)
  @JoinColumn({ name: "id_payment_method" })
  paymentMethod: PaymentMethod;
}
