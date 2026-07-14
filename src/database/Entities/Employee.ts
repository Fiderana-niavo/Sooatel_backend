import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

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
}
