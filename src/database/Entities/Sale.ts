import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Employee } from "./Employee";
import { Room } from "./Room";

@Entity("sales")
export class Sale extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_sale" })
  idSale: string;

  @Column({ type: "varchar", length: 20, unique: true, name: "ref" })
  ref: string;

  @Column({ type: "date", name: "sale_date" })
  saleDate: Date;

  @Column({ type: "numeric", precision: 15, scale: 2, nullable: true, name: "total_amount" })
  totalAmount: number;

  @Column({ type: "numeric", precision: 15, scale: 2, nullable: true, name: "balance_due" })
  balanceDue: number;

  @Column({ type: "integer", nullable: true, name: "table_number" })
  tableNumber: number;

  @Column({ type: "boolean", nullable: true, name: "charge_to_room" })
  chargeToRoom: boolean;

  @Column({ type: "uuid", nullable: true, name: "id_room" })
  idRoom: string;

  @Column({ type: "uuid", name: "id_saler" })
  idSaler: string;

  @ManyToOne(() => Room)
  @JoinColumn({ name: "id_room" })
  room: Room;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: "id_saler" })
  saler: Employee;
}
