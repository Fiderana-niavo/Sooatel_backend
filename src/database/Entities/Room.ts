import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { RoomType } from "./RoomType";

@Entity("room")
export class Room extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_room" })
  idRoom: string;

  @Column({ type: "varchar", length: 50, unique: true, name: "room_number" })
  roomNumber: string;

  @Column({ type: "uuid", name: "id_room_type" })
  idRoomType: string;

  @Column({ type: "varchar", length: 255, nullable: true, name: "description" })
  description: string;

  @ManyToOne(() => RoomType)
  @JoinColumn({ name: "id_room_type" })
  roomType: RoomType;
}
