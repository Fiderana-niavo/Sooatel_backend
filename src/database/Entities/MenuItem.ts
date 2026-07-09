import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Item } from "./Item";
import { MenuCategory } from "./MenuCategory";

@Entity("menu_items")
export class MenuItem extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_menu" })
  idMenu: string;

  @Column({ type: "varchar", length: 20, unique: true, name: "ref" })
  ref: string;

  @Column({ type: "uuid", name: "id_item" })
  idItem: string;

  @Column({ type: "numeric", precision: 10, scale: 2, name: "sale_price" })
  salePrice: number;

  @Column({ type: "numeric", precision: 10, scale: 2, nullable: true, name: "recipe_cost" })
  recipeCost: number;

  @Column({ type: "uuid", name: "id_category" })
  idCategory: string;

  @ManyToOne(() => Item)
  @JoinColumn({ name: "id_item" })
  item: Item;

  @ManyToOne(() => MenuCategory)
  @JoinColumn({ name: "id_category" })
  category: MenuCategory;
}
