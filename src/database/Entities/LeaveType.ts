import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { EmployeeLeaveBalance } from "./EmployeeLeaveBalance";
import { Leave } from "./Leave";
import { LeaveTransaction } from "./LeaveTransaction";

@Entity("leave_types")
export class LeaveType extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_leave_type" })
  idLeaveType: string;

  @Column({ type: "varchar", length: 50, unique: true, name: "label" })
  label: string;

  @Column({ type: "boolean", nullable: true, name: "is_paid" })
  isPaid: boolean;

  @Column({ type: "boolean", nullable: true, name: "requires_proof" })
  requiresProof: boolean;

  @OneToMany(() => EmployeeLeaveBalance, (elb) => elb.leaveType)
  leaveBalances: EmployeeLeaveBalance[];

  @OneToMany(() => Leave, (l) => l.leaveType)
  leaves: Leave[];

  @OneToMany(() => LeaveTransaction, (lt) => lt.leaveType)
  leaveTransactions: LeaveTransaction[];
}
