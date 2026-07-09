import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("team")
export class Team extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_team" })
  idTeam: string;

  @Column({ type: "varchar", length: 70, unique: true, name: "team_name" })
  teamName: string;

  @Column({ type: "varchar", length: 100, nullable: true, name: "description" })
  description: string;
}
