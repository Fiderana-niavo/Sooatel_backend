import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Employee } from "./Employee";
import { Team } from "./Team";

@Entity("employee_team")
export class EmployeeTeam extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_employee_team" })
  idEmployeeTeam: string;

  @Column({ type: "uuid", unique: true, name: "id_team" })
  idTeam: string;

  @Column({ type: "uuid", unique: true, name: "id_employee" })
  idEmployee: string;

  @ManyToOne(() => Team, (t) => t.employeeTeams)
  @JoinColumn({ name: "id_team" })
  team: Team;

  @ManyToOne(() => Employee, (e) => e.employeeTeams)
  @JoinColumn({ name: "id_employee" })
  employee: Employee;
}
