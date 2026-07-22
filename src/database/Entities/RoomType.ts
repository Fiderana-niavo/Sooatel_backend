import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("room_type")
export class RoomType extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_room_type" })
  idRoomType: string;

  @Column({ type: "varchar", length: 50, unique: true, name: "label" })
  label: string;

  @Column({ type: "varchar", length: 255, nullable: true, name: "description" })
  description: string;
}
