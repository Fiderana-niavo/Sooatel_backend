import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Employee } from "./Employee";
import { Item } from "./Item";

@Entity("stock_movement")
export class StockMovement extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_stock_movement" })
  idStockMovement: string;

  @Column({ type: "varchar", length: 20, unique: true, name: "ref" })
  ref: string;

  @Column({ type: "uuid", name: "id_item" })
  idItem: string;

  @Column({ type: "timestamptz", nullable: true, name: "movement_date" })
  movementDate: Date;

  @Column({ type: "numeric", precision: 15, scale: 2, name: "quantity" })
  quantity: number;

  @Column({ type: "integer", nullable: true, name: "movement_type" })
  movementType: number;

  @Column({ type: "uuid", name: "id_operator" })
  idOperator: string;

  @ManyToOne(() => Item)
  @JoinColumn({ name: "id_item" })
  item: Item;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: "id_operator" })
  operator: Employee;
}
