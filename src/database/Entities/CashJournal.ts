import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Employee } from "./Employee";
import { PaymentMethodBalance } from "./PaymentMethodBalance";

@Entity("cash_journal")
export class CashJournal extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_journal" })
  idJournal: string;

  @Column({ type: "varchar", length: 20, unique: true, name: "ref" })
  ref: string;

  @Column({ type: "timestamptz", name: "journal_opening" })
  journalOpening: Date;

  @Column({ type: "timestamptz", nullable: true, name: "journal_closing" })
  journalClosing: Date;

  @Column({ type: "numeric", precision: 15, scale: 2, name: "expected_closing_balance" })
  expectedClosingBalance: number;

  @Column({
    type: "numeric",
    precision: 15,
    scale: 2,
    nullable: true,
    name: "actual_closing_balance",
  })
  actualClosingBalance: number;

  @Column({ type: "numeric", precision: 15, scale: 2, nullable: true, name: "cash_discrepancy" })
  cashDiscrepancy: number;

  @Column({ type: "uuid", name: "id_cashier" })
  idCashier: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: "id_cashier" })
  cashier: Employee;

  @OneToMany(() => PaymentMethodBalance, balance => balance.journal)
  paymentMethodBalances: PaymentMethodBalance[];
}
