import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Item } from "./Item";
import { SupplierProduct } from "./SupplierProduct";

@Entity("supplied_items")
export class SuppliedItem extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_supplied_item" })
  idSuppliedItem: string;

  @Column({ type: "uuid", name: "id_item" })
  idItem: string;

  @Column({ type: "uuid", name: "id_supplier_product" })
  idSupplierProduct: string;

  @ManyToOne(() => Item)
  @JoinColumn({ name: "id_item" })
  item: Item;

  @ManyToOne(() => SupplierProduct)
  @JoinColumn({ name: "id_supplier_product" })
  supplierProduct: SupplierProduct;
}
