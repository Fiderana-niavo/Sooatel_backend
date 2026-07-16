import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Employee } from "./Employee";
import { EmployeeAvailability } from "./EmployeeAvailability";
import { EmploymentType } from "./EmploymentType";
import { JobTitle } from "./JobTitle";

@Entity("employees_job")
export class EmployeeJob extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_emp_job" })
  idEmpJob: string;

  @Column({ type: "date", nullable: true, name: "assignment_date" })
  assignmentDate: Date;

  @Column({ type: "date", nullable: true, name: "end_date" })
  endDate: Date;

  @Column({ type: "boolean", nullable: true, name: "has_fixed_schedule" })
  hasFixedSchedule: boolean;

  @Column({ type: "uuid", name: "id_employment_type" })
  idEmploymentType: string;

  @Column({ type: "uuid", name: "id_employee" })
  idEmployee: string;

  @Column({ type: "uuid", name: "id_job_title" })
  idJobTitle: string;

  @ManyToOne(() => EmploymentType)
  @JoinColumn({ name: "id_employment_type" })
  employmentType: EmploymentType;

  @ManyToOne(() => Employee, (emp) => emp.employeeJobs)
  @JoinColumn({ name: "id_employee" })
  employee: Employee;

  @ManyToOne(() => JobTitle, (jt) => jt.employeeJobs)
  @JoinColumn({ name: "id_job_title" })
  jobTitle: JobTitle;

  @OneToMany(() => EmployeeAvailability, (ea) => ea.empJob)
  availabilities: EmployeeAvailability[];
}
