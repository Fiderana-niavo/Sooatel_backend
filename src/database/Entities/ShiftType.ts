import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("shift_type")
export class ShiftType extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_shift_type" })
  idShiftType: string;

  @Column({ type: "varchar", length: 50, name: "label" })
  label: string;

  @Column({ type: "time", name: "custom_start_time" })
  customStartTime: string;

  @Column({ type: "time", name: "custom_end_time" })
  customEndTime: string;

  @Column({ type: "varchar", length: 255, nullable: true, name: "description" })
  description: string;
}
