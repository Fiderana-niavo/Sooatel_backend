import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "./Role";
import { Permission } from "./Permission";

@Entity("role_permission")
export class RolePermission extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_role_permission" })
  idRolePermission: string;

  @Column({ type: "uuid", name: "id_role" })
  idRole: string;

  @Column({ type: "uuid", name: "id_permission" })
  idPermission: string;

  @ManyToOne(() => Role, (r) => r.rolePermissions)
  @JoinColumn({ name: "id_role" })
  role: Role;

  @ManyToOne(() => Permission, (p) => p.rolePermissions)
  @JoinColumn({ name: "id_permission" })
  permission: Permission;
}
