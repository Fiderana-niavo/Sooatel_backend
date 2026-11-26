import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Employee } from "./Employee";
import { Leave } from "./Leave";
import { LeaveType } from "./LeaveType";

@Entity("leave_transactions")
export class LeaveTransaction extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_transaction" })
  idTransaction: string;

  @Column({ type: "varchar", length: 20, name: "transaction_type" })
  transactionType: string;

  @Column({ type: "numeric", precision: 5, scale: 2, nullable: true, name: "amount" })
  amount: number;

  @Column({ type: "timestamptz", nullable: true, name: "created_at" })
  createdAt: Date;

  @Column({ type: "uuid", nullable: true, name: "id_leave" })
  idLeave: string | null;

  @Column({ type: "uuid", name: "id_leave_type" })
  idLeaveType: string;

  @Column({ type: "uuid", name: "id_employee" })
  idEmployee: string;

  @ManyToOne(() => Leave, { nullable: true })
  @JoinColumn({ name: "id_leave" })
  leave: Leave | null;

  @ManyToOne(() => LeaveType, (lt) => lt.leaveTransactions)
  @JoinColumn({ name: "id_leave_type" })
  leaveType: LeaveType;

  @ManyToOne(() => Employee, (e) => e.leaveTransactions)
  @JoinColumn({ name: "id_employee" })
  employee: Employee;
}
