import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Employee } from "./Employee";
import { Schedule } from "./Schedule";

@Entity("attendances")
export class Attendance extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_attendance" })
  idAttendance: string;

  @Column({ type: "timestamptz", name: "clock_in" })
  clockIn: Date;

  @Column({ type: "timestamptz", nullable: true, name: "clock_out" })
  clockOut: Date;

  @Column({ type: "uuid", name: "id_schedule" })
  idSchedule: string;

  @Column({ type: "uuid", name: "id_employee" })
  idEmployee: string;

  @ManyToOne(() => Schedule)
  @JoinColumn({ name: "id_schedule" })
  schedule: Schedule;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: "id_employee" })
  employee: Employee;
}
