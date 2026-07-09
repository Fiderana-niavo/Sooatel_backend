import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("event")
export class Event extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_event" })
  idEvent: string;

  @Column({ type: "varchar", length: 50, nullable: true, name: "event_name" })
  eventName: string;

  @Column({ type: "date", name: "start_date" })
  startDate: Date;

  @Column({ type: "date", nullable: true, name: "end_date" })
  endDate: Date;
}
