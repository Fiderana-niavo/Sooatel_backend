import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Employee } from "./Employee";
import { LeaveType } from "./LeaveType";

@Entity("employee_leave_balances")
export class EmployeeLeaveBalance extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_employee_leave_balance" })
  idEmployeeLeaveBalance: string;

  @Column({ type: "decimal", precision: 6, scale: 2, default: 0, name: "allocated_days" })
  allocatedDays: number;

  @Column({ type: "decimal", precision: 6, scale: 2, nullable: true, default: 0, name: "used_days" })
  usedDays: number;

  @Column({ type: "decimal", precision: 6, scale: 2, nullable: true, default: 0, name: "advance_days" })
  advanceDays: number;

  @Column({ type: "uuid", name: "id_employee" })
  idEmployee: string;

  @Column({ type: "uuid", name: "id_leave_type" })
  idLeaveType: string;

  @ManyToOne(() => Employee, (e) => e.leaveBalances)
  @JoinColumn({ name: "id_employee" })
  employee: Employee;

  @ManyToOne(() => LeaveType, (lt) => lt.leaveBalances)
  @JoinColumn({ name: "id_leave_type" })
  leaveType: LeaveType;
}
