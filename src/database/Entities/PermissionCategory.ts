import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("permission_category")
export class PermissionCategory extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_category" })
  idCategory: string;

  @Column({ type: "varchar", length: 100, unique: true, name: "name" })
  name: string;

  @Column({ type: "varchar", length: 50, unique: true, name: "code" })
  code: string;
}
