import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { JobTitle } from "./JobTitle";
import { ShiftType } from "./ShiftType";

@Entity("employee_requirements")
export class EmployeeRequirement extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_requirement" })
  idRequirement: string;

  @Column({ type: "integer", nullable: true, name: "day_of_week" })
  dayOfWeek: number;

  @Column({ type: "integer", name: "required_count" })
  requiredCount: number;

  @Column({ type: "uuid", name: "id_shift_type" })
  idShiftType: string;

  @Column({ type: "uuid", name: "id_job_title" })
  idJobTitle: string;

  @ManyToOne(() => ShiftType)
  @JoinColumn({ name: "id_shift_type" })
  shiftType: ShiftType;

  @ManyToOne(() => JobTitle)
  @JoinColumn({ name: "id_job_title" })
  jobTitle: JobTitle;
}
