import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("job_titles")
export class JobTitle extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_job_title" })
  idJobTitle: string;

  @Column({ type: "varchar", length: 100, nullable: true, name: "title" })
  title: string;
}
