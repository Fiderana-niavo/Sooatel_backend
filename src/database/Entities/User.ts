import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Employee } from "./Employee";
import { UserRole } from "./UserRole";
import { UserPermission } from "./UserPermission";

@Entity("users")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_user" })
  idUser: string;

  @Column({ type: "varchar", length: 20, unique: true, name: "ref" })
  ref: string;

  @Column({ type: "varchar", length: 254, unique: true, name: "username" })
  username: string;

  @Column({ type: "varchar", length: 255, name: "password_hash" })
  passwordHash: string;

  @Column({ type: "integer", name: "active_status" })
  activeStatus: number;

  @Column({ type: "timestamptz", nullable: true, name: "activated_at" })
  activatedAt: Date;

  @Column({ type: "timestamptz", nullable: true, name: "activated_from" })
  activatedFrom: Date;

  @Column({ type: "timestamptz", name: "created_date" })
  createdDate: Date;

  @Column({ type: "uuid", name: "id_employee" })
  idEmployee: string;

  @ManyToOne(() => Employee, (emp) => emp.users)
  @JoinColumn({ name: "id_employee" })
  employee: Employee;

  @OneToMany(() => UserRole, (ur) => ur.user)
  userRoles: UserRole[];

  @OneToMany(() => UserPermission, (up) => up.user)
  userPermissions: UserPermission[];
}
