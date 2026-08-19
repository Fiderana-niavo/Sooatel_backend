import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Employee } from "./Employee";
import { Supplier } from "./Supplier";
import { PurchaseDetail } from "./PurchaseDetail";

@Entity("purchases")
export class Purchase extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_purchase" })
  idPurchase: string;

  @Column({ type: "varchar", length: 20, unique: true, name: "ref", insert: false, update: false })
  ref: string;

  @Column({ type: "timestamp", name: "purchase_date" })
  purchaseDate: Date;

  @Column({ type: "numeric", precision: 15, scale: 2, nullable: true, name: "total_amount" })
  totalAmount: number;

  @Column({ type: "numeric", precision: 15, scale: 2, nullable: true, name: "balance_due" })
  balanceDue: number;

  @Column({ type: "int", name: "status", nullable: true })
  status: number;

  @Column({ type: "int", name: "lifecycle_status", nullable: true, default: 5 })
  lifecycleStatus: number;

  @Column({ type: "uuid", name: "id_supplier" })
  idSupplier: string;

  @Column({ type: "uuid", name: "id_purchaser" })
  idPurchaser: string;

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: "id_supplier" })
  supplier: Supplier;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: "id_purchaser" })
  purchaser: Employee;

  @OneToMany(() => PurchaseDetail, (detail: PurchaseDetail) => detail.purchase)
  details: PurchaseDetail[];
}

