import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Item } from "./Item";
import { Employee } from "./Employee";

@Entity("dish_production")
export class DishProduction extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_dish_production" })
  idDishProduction: string;

  @Column({ type: "varchar", length: 50, unique: true, name: "ref" })
  ref: string;

  @Column({ type: "uuid", name: "id_item" })
  idItem: string;

  @Column({ type: "timestamptz", name: "production_date" })
  productionDate: Date;

  @Column({ type: "numeric", precision: 15, scale: 2, nullable: true, name: "quantity" })
  quantity: number;

  @Column({ type: "integer", default: 5, name: "status" })
  status: number;

  @Column({ type: "uuid", name: "id_operator" })
  idOperator: string;

  @Column({ type: "varchar", length: 500, nullable: true, name: "notes" })
  notes: string | null;

  @ManyToOne(() => Item)
  @JoinColumn({ name: "id_item" })
  item: Item;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: "id_operator" })
  operator: Employee;
}
