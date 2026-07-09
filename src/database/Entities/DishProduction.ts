import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Item } from "./Item";

@Entity("dish_production")
export class DishProduction extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_dish_production" })
  idDishProduction: string;

  @Column({ type: "uuid", name: "id_item" })
  idItem: string;

  @Column({ type: "timestamptz", name: "production_date" })
  productionDate: Date;

  @Column({ type: "numeric", precision: 15, scale: 2, nullable: true, name: "quantity" })
  quantity: number;

  @ManyToOne(() => Item)
  @JoinColumn({ name: "id_item" })
  item: Item;
}
