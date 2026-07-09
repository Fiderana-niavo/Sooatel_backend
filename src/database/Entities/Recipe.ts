import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Item } from "./Item";
import { ItemUnit } from "./ItemUnit";

@Entity("recipes")
export class Recipe extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_recipe" })
  idRecipe: string;

  @Column({ type: "uuid", name: "id_parent" })
  idParent: string;

  @Column({ type: "uuid", name: "id_ingredient" })
  idIngredient: string;

  @Column({ type: "numeric", precision: 15, scale: 2, name: "quantity" })
  quantity: number;

  @Column({ type: "numeric", precision: 15, scale: 2, nullable: true, name: "cost" })
  cost: number;

  @Column({ type: "uuid", name: "id_item_unit" })
  idItemUnit: string;

  @ManyToOne(() => ItemUnit)
  @JoinColumn({ name: "id_item_unit" })
  itemUnit: ItemUnit;

  @ManyToOne(() => Item)
  @JoinColumn({ name: "id_parent" })
  parent: Item;

  @ManyToOne(() => Item)
  @JoinColumn({ name: "id_ingredient" })
  ingredient: Item;
}
