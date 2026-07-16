import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Permission } from "./Permission";
import { User } from "./User";

@Entity("user_permission")
export class UserPermission extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_user_permission" })
  idUserPermission: string;

  @Column({ type: "uuid", name: "id_user" })
  idUser: string;

  @Column({ type: "uuid", name: "id_permission" })
  idPermission: string;

  @Column({ type: "boolean", name: "is_allowed" })
  isAllowed: boolean;

  @ManyToOne(() => User, (u) => u.userPermissions)
  @JoinColumn({ name: "id_user" })
  user: User;

  @ManyToOne(() => Permission, (p) => p.userPermissions)
  @JoinColumn({ name: "id_permission" })
  permission: Permission;
}
