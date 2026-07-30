import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { CashJournal } from "./CashJournal";
import { Employee } from "./Employee";
import { OutflowCategory } from "./OutflowCategory";

@Entity("cash_outflows")
export class CashOutflow extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_cash_outflows" })
  idCashOutflows: string;

  @Column({ type: "varchar", length: 20, unique: true, name: "ref" })
  ref: string;

  @Column({ type: "numeric", precision: 15, scale: 2, name: "amount" })
  amount: number;

  @Column({ type: "date", nullable: true, name: "outflow_date" })
  outflowDate: Date;

  @Column({ type: "varchar", length: 255, nullable: true, name: "reason" })
  reason: string;

  @Column({ type: "varchar", length: 100, nullable: true, name: "invoice_reference" })
  invoiceReference: string;

  @Column({ type: "uuid", name: "id_processed_by" })
  idProcessedBy: string;

  @Column({ type: "uuid", name: "id_journal" })
  idJournal: string;

  @Column({ type: "integer", nullable: true, name: "status" })
  status: number;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: "id_processed_by" })
  processedBy: Employee;

  @ManyToOne(() => CashJournal)
  @JoinColumn({ name: "id_journal" })
  journal: CashJournal;

  @Column({ type: "uuid", nullable: true, name: "id_outflow_category" })
  idOutflowCategory: string;

  @ManyToOne(() => OutflowCategory)
  @JoinColumn({ name: "id_outflow_category" })
  outflowCategory: OutflowCategory;
}
