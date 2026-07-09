import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("leave_types")
export class LeaveType extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_leave_type" })
  idLeaveType: string;

  @Column({ type: "varchar", length: 50, unique: true, name: "label" })
  label: string;

  @Column({ type: "boolean", nullable: true, name: "is_paid" })
  isPaid: boolean;

  @Column({ type: "boolean", nullable: true, name: "requires_proof" })
  requiresProof: boolean;
}
