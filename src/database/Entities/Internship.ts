import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Employee } from "./Employee";
import { School } from "./School";

@Entity("internship")
export class Internship extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_internship" })
  idInternship: string;

  @Column({ type: "uuid", nullable: true, name: "id_school" })
  idSchool: string;

  @ManyToOne(() => School, (school) => school.internships)
  @JoinColumn({ name: "id_school" })
  school: School;

  @Column({ type: "varchar", length: 255, nullable: true, name: "academic_supervisor_name" })
  academicSupervisorName: string;

  @Column({ type: "varchar", length: 100, nullable: true, name: "academic_supervisor_email" })
  academicSupervisorEmail: string;

  @Column({ type: "varchar", length: 25, nullable: true, name: "academic_supervisor_number" })
  academicSupervisorNumber: string;

  @Column({ type: "varchar", length: 255, nullable: true, name: "professionnal_supervisor_name" })
  professionnalSupervisorName: string;

  @Column({ type: "uuid", name: "id_employee" })
  idEmployee: string;

  @ManyToOne(() => Employee, (emp) => emp.internships)
  @JoinColumn({ name: "id_employee" })
  employee: Employee;
}
