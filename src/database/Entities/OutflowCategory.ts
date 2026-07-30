import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("outflow_category")
export class OutflowCategory extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_outflow_category" })
  idOutflowCategory: string;

  @Column({ type: "varchar", length: 80, unique: true, name: "label" })
  label: string;

  @Column({ type: "varchar", length: 20, unique: true, name: "code", nullable: true })
  code: string | null;
}
