import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Item } from "./Item";

@Entity("recipes")
export class Recipe extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_recipe" })
  idRecipe: string;

  @Column({ type: "numeric", precision: 15, scale: 2, nullable: true, name: "recipe_cost" })
  recipeCost: number;

  @Column({ type: "numeric", precision: 15, scale: 4, default: 1, name: "yield_quantity" })
  yieldQuantity: number;

  @Column({ type: "uuid", name: "id_item" })
  idItem: string;

  @Column({ type: "integer", default: 1, name: "version" })
  version: number;

  @Column({ type: "boolean", default: true, name: "is_active" })
  isActive: boolean;

  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP", name: "created_at" })
  createdAt: Date;

  @ManyToOne(() => Item)
  @JoinColumn({ name: "id_item" })
  item: Item;
}
