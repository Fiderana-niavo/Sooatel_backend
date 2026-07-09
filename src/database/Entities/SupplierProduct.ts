import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Supplier } from "./Supplier";

@Entity("supplier_products")
export class SupplierProduct extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_supplier_product" })
  idSupplierProduct: string;

  @Column({ type: "varchar", length: 20, unique: true, name: "ref" })
  ref: string;

  @Column({ type: "varchar", length: 50, name: "name" })
  name: string;

  @Column({ type: "numeric", precision: 15, scale: 2, name: "actual_price" })
  actualPrice: number;

  @Column({ type: "numeric", precision: 10, scale: 2, name: "min_purchase_number" })
  minPurchaseNumber: number;

  @Column({ type: "uuid", name: "id_supplier" })
  idSupplier: string;

  @Column({ type: "varchar", length: 255, nullable: true, name: "notes" })
  notes: string;

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: "id_supplier" })
  supplier: Supplier;
}
