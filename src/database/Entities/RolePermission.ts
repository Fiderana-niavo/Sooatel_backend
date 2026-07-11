import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Permission } from "./Permission";
import { Role } from "./Role";

@Entity("role_permission")
export class RolePermission extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_role_permission" })
  idRolePermission: string;

  @Column({ type: "uuid", name: "id_role" })
  idRole: string;

  @Column({ type: "uuid", name: "id_permission" })
  idPermission: string;

  @ManyToOne(() => Role)
  @JoinColumn({ name: "id_role" })
  role: Role;

  @ManyToOne(() => Permission)
  @JoinColumn({ name: "id_permission" })
  permission: Permission;
}
