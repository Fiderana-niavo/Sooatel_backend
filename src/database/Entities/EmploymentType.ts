import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("employment_type")
export class EmploymentType extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_employment_type" })
  idEmploymentType: string;

  @Column({ type: "varchar", length: 50, name: "label" })
  label: string;

  @Column({ type: "varchar", length: 255, nullable: true, name: "description" })
  description: string;
}
