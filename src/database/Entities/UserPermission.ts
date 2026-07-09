import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
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

  @ManyToOne(() => User)
  @JoinColumn({ name: "id_user" })
  user: User;

  @ManyToOne(() => Permission)
  @JoinColumn({ name: "id_permission" })
  permission: Permission;
}
