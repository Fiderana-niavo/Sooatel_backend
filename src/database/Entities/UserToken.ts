import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";

@Entity("user_tokens")
export class UserToken extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_token" })
  idToken: string;

  @Column({ type: "varchar", length: 255, unique: true, name: "token" })
  token: string;

  @Column({ type: "varchar", length: 30, nullable: true, name: "token_type" })
  tokenType: string;

  @Column({ type: "timestamptz", name: "expires_at" })
  expiresAt: Date;

  @Column({ type: "boolean", nullable: true, name: "used" })
  used: boolean;

  @Column({ type: "timestamptz", nullable: true, name: "created_at" })
  createdAt: Date;

  @Column({ type: "uuid", name: "id_user" })
  idUser: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "id_user" })
  user: User;
}
