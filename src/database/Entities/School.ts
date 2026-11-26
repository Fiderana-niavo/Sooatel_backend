import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { Internship } from "./Internship";

@Entity("schools")
export class School extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_school" })
  idSchool: string;

  @Column({ type: "varchar", length: 150, unique: true, name: "name" })
  name: string;

  @Column({ type: "varchar", length: 255, nullable: true, name: "address" })
  address: string;

  @Column({ type: "varchar", length: 100, nullable: true, name: "email" })
  email: string;

  @Column({ type: "varchar", length: 25, nullable: true, name: "phone" })
  phone: string;

  @OneToMany(() => Internship, (internship) => internship.school)
  internships: Internship[];
}
