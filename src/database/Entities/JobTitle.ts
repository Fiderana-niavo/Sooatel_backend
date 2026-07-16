import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { EmployeeJob } from "./EmployeeJob";
import { EmployeeRequirement } from "./EmployeeRequirement";

@Entity("job_titles")
export class JobTitle extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_job_title" })
  idJobTitle: string;

  @Column({ type: "varchar", length: 100, nullable: true, name: "title" })
  title: string;

  @OneToMany(() => EmployeeJob, (ej) => ej.jobTitle)
  employeeJobs: EmployeeJob[];

  @OneToMany(() => EmployeeRequirement, (er) => er.jobTitle)
  employeeRequirements: EmployeeRequirement[];
}
