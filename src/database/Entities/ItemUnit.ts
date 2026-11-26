import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Item } from "./Item";
import { UnitOfMeasure } from "./UnitOfMeasure";

@Entity("item_unit")
export class ItemUnit extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_item_unit" })
  idItemUnit: string;

  @Column({ type: "numeric", precision: 15, scale: 6, name: "to_stock_ratio" })
  toStockRatio: number;

  @Column({ type: "uuid", name: "alternative_unit" })
  alternativeUnitId: string;

  @Column({ type: "uuid", name: "id_item" })
  idItem: string;

  @ManyToOne(() => UnitOfMeasure)
  @JoinColumn({ name: "alternative_unit" })
  alternativeUnit: UnitOfMeasure;

  @ManyToOne(() => Item)
  @JoinColumn({ name: "id_item" })
  item: Item;
}
