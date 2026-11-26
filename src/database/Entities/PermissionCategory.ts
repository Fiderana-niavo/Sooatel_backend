import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Permission } from "./Permission";

@Entity("permission_category")
export class PermissionCategory extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_category" })
  idCategory: string;

  @Column({ type: "varchar", length: 100, unique: true, name: "name" })
  name: string;

  @Column({ type: "varchar", length: 50, unique: true, name: "code" })
  code: string;

  @OneToMany(() => Permission, (p) => p.category)
  permissions: Permission[];
}
