import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { PaymentMethodBalance } from "./PaymentMethodBalance";

@Entity("payment_method")
export class PaymentMethod extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_payment_method" })
  idPaymentMethod: string;

  @Column({ type: "varchar", length: 50, nullable: true, name: "label" })
  label: string;

  @Column({ type: "varchar", length: 50, nullable: true, name: "description" })
  description: string;

  @OneToMany(() => PaymentMethodBalance, balance => balance.paymentMethod)
  paymentMethodBalances: PaymentMethodBalance[];
}
