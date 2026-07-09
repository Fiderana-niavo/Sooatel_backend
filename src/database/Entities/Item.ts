import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ItemType } from "./ItemType";
import { UnitOfMeasure } from "./UnitOfMeasure";

@Entity("items")
export class Item extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_item" })
  idItem: string;

  @Column({ type: "varchar", length: 20, unique: true, name: "ref" })
  ref: string;

  @Column({ type: "varchar", length: 100, unique: true, name: "label" })
  label: string;

  @Column({ type: "boolean", nullable: true, name: "is_produced" })
  isProduced: boolean;

  @Column({ type: "numeric", precision: 15, scale: 2, nullable: true, name: "quantity" })
  quantity: number;

  @Column({ type: "numeric", precision: 15, scale: 2, name: "minimum_stock_level" })
  minimumStockLevel: number;

  @Column({ type: "numeric", precision: 15, scale: 2, nullable: true, name: "reorder_quantity" })
  reorderQuantity: number;

  @Column({ type: "boolean", name: "is_perishable" })
  isPerishable: boolean;

  @Column({ type: "integer", name: "status" })
  status: number;

  @Column({ type: "uuid", name: "id_product_type" })
  idProductType: string;

  @Column({ type: "uuid", name: "id_unit" })
  idUnit: string;

  @Column({ type: "varchar", length: 255, nullable: true, name: "description" })
  description: string;

  @ManyToOne(() => ItemType)
  @JoinColumn({ name: "id_product_type" })
  productType: ItemType;

  @ManyToOne(() => UnitOfMeasure)
  @JoinColumn({ name: "id_unit" })
  unit: UnitOfMeasure;
}
