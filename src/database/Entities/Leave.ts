import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Employee } from "./Employee";
import { LeaveType } from "./LeaveType";

@Entity("leaves")
export class Leave extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_leave" })
  idLeave: string;

  @Column({ type: "varchar", length: 20, unique: true, name: "ref" })
  ref: string;

  @Column({ type: "timestamptz", name: "start_date" })
  startDate: Date;

  @Column({ type: "timestamptz", name: "end_date" })
  endDate: Date;

  @Column({ type: "varchar", length: 10, nullable: true, name: "leave_unit" })
  leaveUnit: string;

  @Column({ type: "uuid", name: "id_employee" })
  idEmployee: string;

  @Column({ type: "uuid", name: "id_leave_type" })
  idLeaveType: string;

  @Column({ type: "integer", nullable: true, name: "status" })
  status: number;

  @ManyToOne(() => Employee, (e) => e.leaves)
  @JoinColumn({ name: "id_employee" })
  employee: Employee;

  @ManyToOne(() => LeaveType, (lt) => lt.leaves)
  @JoinColumn({ name: "id_leave_type" })
  leaveType: LeaveType;
}
