import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Employee } from "./Employee";
import { LeaveType } from "./LeaveType";

@Entity("employee_leave_balances")
export class EmployeeLeaveBalance extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_employee_leave_balance" })
  idEmployeeLeaveBalance: string;

  @Column({ type: "integer", name: "allocated_days" })
  allocatedDays: number;

  @Column({ type: "integer", nullable: true, name: "used_days" })
  usedDays: number;

  @Column({ type: "uuid", name: "id_employee" })
  idEmployee: string;

  @Column({ type: "uuid", name: "id_leave_type" })
  idLeaveType: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: "id_employee" })
  employee: Employee;

  @ManyToOne(() => LeaveType)
  @JoinColumn({ name: "id_leave_type" })
  leaveType: LeaveType;
}
