import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Employee } from "./Employee";
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

  @Column({ type: "uuid", name: "id_leave_type" })
  idLeaveType: string;

  @Column({ type: "uuid", name: "id_employee" })
  idEmployee: string;

  @ManyToOne(() => LeaveType)
  @JoinColumn({ name: "id_leave_type" })
  leaveType: LeaveType;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: "id_employee" })
  employee: Employee;
}
