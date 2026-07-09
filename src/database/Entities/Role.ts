import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("role")
export class Role extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_role" })
  idRole: string;

  @Column({ type: "varchar", length: 50, unique: true, name: "label" })
  label: string;

  @Column({ type: "varchar", length: 255, nullable: true, name: "description" })
  description: string;
}
