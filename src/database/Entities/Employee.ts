import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Attendance } from "./Attendance";
import { EmployeeJob } from "./EmployeeJob";
import { EmployeeLeaveBalance } from "./EmployeeLeaveBalance";
import { EmployeeTeam } from "./EmployeeTeam";
import { Internship } from "./Internship";
import { Leave } from "./Leave";
import { LeaveTransaction } from "./LeaveTransaction";
import { Schedule } from "./Schedule";
import { User } from "./User";

@Entity("employees")
export class Employee extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_employee" })
  idEmployee: string;

  @Column({ type: "varchar", length: 20, unique: true, name: "employee_code" })
  employeeCode: string;

  @Column({ type: "varchar", length: 100, nullable: true, name: "name" })
  name: string;

  @Column({ type: "varchar", length: 100, nullable: true, name: "lastname" })
  lastname: string;

  @Column({ type: "date", nullable: true, name: "birthdate" })
  birthdate: Date;

  @Column({ type: "varchar", length: 255, nullable: true, name: "address" })
  address: string;

  @Column({ type: "varchar", length: 254, nullable: true, unique: true, name: "email_contact" })
  emailContact: string;

  @Column({ type: "varchar", length: 20, nullable: true, unique: true, name: "phone_number" })
  phoneNumber: string;

  @Column({ type: "varchar", length: 255, nullable: true, name: "notes" })
  notes: string;

  @Column({ type: "integer", default: 0, name: "active_status" })
  activeStatus: number;

  @OneToMany(() => EmployeeJob, (ej) => ej.employee)
  employeeJobs: EmployeeJob[];

  @OneToMany(() => Internship, (intern) => intern.employee)
  internships: Internship[];

  @OneToMany(() => User, (user) => user.employee)
  users: User[];

  @OneToMany(() => EmployeeTeam, (et) => et.employee)
  employeeTeams: EmployeeTeam[];

  @OneToMany(() => Leave, (l) => l.employee)
  leaves: Leave[];

  @OneToMany(() => EmployeeLeaveBalance, (elb) => elb.employee)
  leaveBalances: EmployeeLeaveBalance[];

  @OneToMany(() => Attendance, (a) => a.employee)
  attendances: Attendance[];

  @OneToMany(() => Schedule, (s) => s.employee)
  schedules: Schedule[];

  @OneToMany(() => LeaveTransaction, (lt) => lt.employee)
  leaveTransactions: LeaveTransaction[];
}
