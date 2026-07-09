import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { PermissionCategory } from "./PermissionCategory";

@Entity("permission")
export class Permission extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_permission" })
  idPermission: string;

  @Column({ type: "varchar", length: 50, unique: true, name: "permission_name" })
  permissionName: string;

  @Column({ type: "varchar", length: 100, nullable: true, name: "description" })
  description: string;

  @Column({ type: "uuid", name: "id_category" })
  idCategory: string;

  @ManyToOne(() => PermissionCategory)
  @JoinColumn({ name: "id_category" })
  category: PermissionCategory;
}
