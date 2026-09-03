import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Item } from "./Item";
import { ItemUnit } from "./ItemUnit";
import { Recipe } from "./Recipe";

@Entity("recipe_details")
export class RecipeDetail extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_recipe_detail" })
  idRecipeDetail: string;

  @Column({ type: "numeric", precision: 15, scale: 2, name: "quantity" })
  quantity: number;

  @Column({ type: "uuid", name: "id_item_unit", nullable: true })
  idItemUnit: string;

  @Column({ type: "uuid", name: "id_ingredient" })
  idIngredient: string;

  @Column({ type: "uuid", name: "id_recipe" })
  idRecipe: string;

  @Column({ type: "integer", default: 1, name: "version" })
  version: number;

  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP", name: "created_at" })
  createdAt: Date;

  @ManyToOne(() => ItemUnit)
  @JoinColumn({ name: "id_item_unit" })
  itemUnit: ItemUnit;

  @ManyToOne(() => Item)
  @JoinColumn({ name: "id_ingredient" })
  ingredient: Item;

  @ManyToOne(() => Recipe)
  @JoinColumn({ name: "id_recipe" })
  recipe: Recipe;
}
