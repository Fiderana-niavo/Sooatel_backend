import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { EmployeeLeaveBalance } from "./EmployeeLeaveBalance";
import { Leave } from "./Leave";
import { LeaveTransaction } from "./LeaveTransaction";
import { DEDUCTION_MODE, CAP_PERIOD } from "../../shared/constants/leave.constants";
import type { DeductionMode, CapPeriod } from "../../shared/constants/leave.constants";

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

  // How this leave type interacts with the annual leave balance
  @Column({
    type: "enum",
    enum: DEDUCTION_MODE,
    default: DEDUCTION_MODE.NEVER,
    name: "deduction_mode",
  })
  deductionMode: DeductionMode;

  // Max days allowed for this type (null = no limit). Not applicable to OPTIONAL mode.
  @Column({ type: "int", nullable: true, name: "cap" })
  cap: number | null;

  // Period over which the cap is evaluated (null when cap is null)
  @Column({
    type: "enum",
    enum: CAP_PERIOD,
    nullable: true,
    name: "cap_period",
  })
  capPeriod: CapPeriod | null;

  @OneToMany(() => EmployeeLeaveBalance, (elb) => elb.leaveType)
  leaveBalances: EmployeeLeaveBalance[];

  @OneToMany(() => Leave, (l) => l.leaveType)
  leaves: Leave[];

  @OneToMany(() => LeaveTransaction, (lt) => lt.leaveType)
  leaveTransactions: LeaveTransaction[];
}

