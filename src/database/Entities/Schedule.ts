import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Employee } from "./Employee";
import { ShiftType } from "./ShiftType";
import { Attendance } from "./Attendance";

@Entity("schedules")
export class Schedule extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_schedule" })
  idSchedule: string;

  @Column({ type: "date", nullable: true, name: "schedule_date" })
  scheduleDate: Date;

  @Column({ type: "time", nullable: true, name: "custom_start_time" })
  customStartTime: string;

  @Column({ type: "time", nullable: true, name: "custom_end_time" })
  customEndTime: string;

  @Column({ type: "uuid", nullable: true, name: "id_shift_type" })
  idShiftType: string;

  @Column({ type: "uuid", name: "id_employee" })
  idEmployee: string;

  @ManyToOne(() => ShiftType, (st) => st.schedules)
  @JoinColumn({ name: "id_shift_type" })
  shiftType: ShiftType;

  @ManyToOne(() => Employee, (e) => e.schedules)
  @JoinColumn({ name: "id_employee" })
  employee: Employee;

  @OneToMany(() => Attendance, (a) => a.schedule)
  attendances: Attendance[];
}
