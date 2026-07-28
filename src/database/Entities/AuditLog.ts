import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";
import { User } from "./User";

@Entity("audit_logs")
export class AuditLog extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_audit" })
  idAudit: string;

  @Column({ type: "varchar", length: 100, name: "entity_name" })
  entityName: string;

  @Column({ type: "uuid", name: "entity_id" })
  entityId: string;

  @Column({ type: "varchar", length: 50, name: "action" })
  action: string;

  @Column({ type: "jsonb", nullable: true, name: "old_value" })
  oldValue: any;

  @Column({ type: "jsonb", nullable: true, name: "new_value" })
  newValue: any;

  @Column({ type: "uuid", name: "id_user" })
  idUser: string;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: "id_user" })
  user: User;
}
