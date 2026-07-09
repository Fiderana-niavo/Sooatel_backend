import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { EmployeeJob } from "./EmployeeJob";
import { ShiftType } from "./ShiftType";

@Entity("employee_availabilities")
export class EmployeeAvailability extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_availability" })
  idAvailability: string;

  @Column({ type: "integer", nullable: true, name: "day_of_week" })
  dayOfWeek: number;

  @Column({ type: "time", nullable: true, name: "custom_start_time" })
  customStartTime: string;

  @Column({ type: "time", nullable: true, name: "custom_end_time" })
  customEndTime: string;

  @Column({ type: "uuid", nullable: true, name: "id_shift_type" })
  idShiftType: string;

  @Column({ type: "uuid", name: "id_emp_job" })
  idEmpJob: string;

  @ManyToOne(() => ShiftType)
  @JoinColumn({ name: "id_shift_type" })
  shiftType: ShiftType;

  @ManyToOne(() => EmployeeJob)
  @JoinColumn({ name: "id_emp_job" })
  empJob: EmployeeJob;
}
