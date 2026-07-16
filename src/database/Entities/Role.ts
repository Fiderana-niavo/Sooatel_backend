import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { RolePermission } from "./RolePermission";
import { UserRole } from "./UserRole";

@Entity("role")
export class Role extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_role" })
  idRole: string;

  @Column({ type: "varchar", length: 50, unique: true, name: "label" })
  label: string;

  @Column({ type: "varchar", length: 255, nullable: true, name: "description" })
  description: string;

  @OneToMany(() => RolePermission, (rp) => rp.role)
  rolePermissions: RolePermission[];

  @OneToMany(() => UserRole, (ur) => ur.role)
  userRoles: UserRole[];
}
