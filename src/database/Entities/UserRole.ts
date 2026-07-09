import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "./Role";
import { User } from "./User";

@Entity("user_role")
export class UserRole extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_user_role" })
  idUserRole: string;

  @Column({ type: "uuid", name: "id_user" })
  idUser: string;

  @Column({ type: "uuid", name: "id_role" })
  idRole: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "id_user" })
  user: User;

  @ManyToOne(() => Role)
  @JoinColumn({ name: "id_role" })
  role: Role;
}
