import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { CashJournal } from "./CashJournal";
import { Employee } from "./Employee";
import { CashMovementCategory } from "./CashMovementCategory";
import { PaymentMethod } from "./PaymentMethod";

@Entity("cash_movement")
export class CashMovement extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_cash_movement" })
  idCashMovement: string;

  @Column({ type: "varchar", length: 20, unique: true, name: "ref" })
  ref: string;

  @Column({ type: "numeric", precision: 15, scale: 2, name: "amount" })
  amount: number;

  @Column({ type: "timestamp", nullable: true, name: "movement_date" })
  movementDate: Date | null;

  @Column({ type: "varchar", length: 255, nullable: true, name: "reason" })
  reason: string | null;

  @Column({ type: "varchar", length: 100, nullable: true, name: "invoice_reference" })
  invoiceReference: string | null;

  @Column({ type: "integer", name: "direction" })
  direction: number; // -5 for outflow, 5 for inflow

  @Column({ type: "uuid", name: "id_processed_by" })
  idProcessedBy: string;

  @Column({ type: "uuid", name: "id_journal" })
  idJournal: string;

  @Column({ type: "integer", nullable: true, name: "status" })
  status: number | null;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: "id_processed_by" })
  processedBy: Employee;

  @ManyToOne(() => CashJournal)
  @JoinColumn({ name: "id_journal" })
  journal: CashJournal;

  @Column({ type: "uuid", nullable: true, name: "id_cash_movement_category" })
  idCashMovementCategory: string | null;

  @ManyToOne(() => CashMovementCategory)
  @JoinColumn({ name: "id_cash_movement_category" })
  cashMovementCategory: CashMovementCategory;

  @Column({ type: "uuid", name: "id_payment_method" })
  idPaymentMethod: string;

  @ManyToOne(() => PaymentMethod)
  @JoinColumn({ name: "id_payment_method" })
  paymentMethod: PaymentMethod;
}
