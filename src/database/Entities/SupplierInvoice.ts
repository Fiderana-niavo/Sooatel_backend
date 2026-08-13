import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Check } from "typeorm";
import { ProductDelivery } from "./ProductDelivery";
import { SupplierPayment } from "./SupplierPayment";
import { Purchase } from "./Purchase";

@Entity("supplier_invoice")
@Check(`("id_delivery" IS NULL) <> ("id_purchase" IS NULL)`)
export class SupplierInvoice extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_supplier_invoice" })
  idSupplierInvoice: string;

  @Column({ type: "varchar", length: 20, unique: true, name: "ref" })
  ref: string;

  @Column({ type: "uuid", name: "id_delivery", nullable: true })
  idDelivery: string;

  @Column({ type: "uuid", name: "id_purchase", nullable: true })
  idPurchase: string;

  @Column({ type: "numeric", precision: 15, scale: 2, nullable: true, name: "total_amount" })
  totalAmount: number;

  @Column({ type: "numeric", precision: 15, scale: 2, nullable: true, name: "balance_due" })
  balanceDue: number;

  @Column({ type: "timestamptz", name: "invoice_date", nullable: true })
  invoiceDate: Date;

  @Column({ type: "int", name: "status", nullable: true })
  status: number;

  @ManyToOne(() => ProductDelivery)
  @JoinColumn({ name: "id_delivery" })
  delivery: ProductDelivery;

  @ManyToOne(() => Purchase)
  @JoinColumn({ name: "id_purchase" })
  purchase: Purchase;

  @OneToMany(() => SupplierPayment, (supplierPayment: SupplierPayment) => supplierPayment.supplierInvoice)
  supplierPayments: SupplierPayment[];
}
