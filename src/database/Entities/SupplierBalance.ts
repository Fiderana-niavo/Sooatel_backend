import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Supplier } from "./Supplier";

@Entity("supplier_balance")
export class SupplierBalance extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_supplier_balance" })
  idSupplierBalance: string;

  @Column({ type: "uuid", name: "id_supplier", unique: true })
  idSupplier: string;

  @Column({ type: "numeric", precision: 15, scale: 2, default: 0, name: "credit" })
  credit: number;

  @Column({ type: "numeric", precision: 15, scale: 2, default: 0, name: "debit" })
  debit: number;

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: "id_supplier" })
  supplier: Supplier;

  /** Solde net disponible */
  get balance(): number {
    return Number(this.credit) - Number(this.debit);
  }
}