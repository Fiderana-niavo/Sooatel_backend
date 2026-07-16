import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { PermissionCategory } from "./PermissionCategory";
import { RolePermission } from "./RolePermission";
import { UserPermission } from "./UserPermission";

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

  @ManyToOne(() => PermissionCategory, (cat) => cat.permissions)
  @JoinColumn({ name: "id_category" })
  category: PermissionCategory;

  @OneToMany(() => RolePermission, (rp) => rp.permission)
  rolePermissions: RolePermission[];

  @OneToMany(() => UserPermission, (up) => up.permission)
  userPermissions: UserPermission[];
}
