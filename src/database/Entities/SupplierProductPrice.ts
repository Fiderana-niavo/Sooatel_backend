import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { SupplierProduct } from "./SupplierProduct";

@Entity("supplier_products_price")
export class SupplierProductPrice extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_supplier_product_price" })
  idSupplierProductPrice: string;

  @Column({ type: "numeric", precision: 15, scale: 2, name: "price" })
  price: number;

  @Column({ type: "date", name: "change_date" })
  changeDate: Date;

  @Column({ type: "uuid", name: "id_supplier_product" })
  idSupplierProduct: string;

  @ManyToOne(() => SupplierProduct)
  @JoinColumn({ name: "id_supplier_product" })
  supplierProduct: SupplierProduct;
}
