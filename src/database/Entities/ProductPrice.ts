import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Event } from "./Event";
import { MenuItem } from "./MenuItem";
import { RoomType } from "./RoomType";

@Entity("product_price")
export class ProductPrice extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_product_price" })
  idProductPrice: string;

  @Column({ type: "uuid", name: "id_menu" })
  idMenu: string;

  @Column({ type: "numeric", precision: 15, scale: 2, nullable: true, name: "special_price" })
  specialPrice: number;

  @Column({ type: "uuid", nullable: true, name: "id_room_type" })
  idRoomType: string;

  @Column({ type: "uuid", nullable: true, name: "id_event" })
  idEvent: string;

  @ManyToOne(() => MenuItem)
  @JoinColumn({ name: "id_menu" })
  menu: MenuItem;

  @ManyToOne(() => RoomType)
  @JoinColumn({ name: "id_room_type" })
  roomType: RoomType;

  @ManyToOne(() => Event)
  @JoinColumn({ name: "id_event" })
  event: Event;
}
