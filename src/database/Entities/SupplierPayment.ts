import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Employee } from "./Employee";
import { PaymentMethod } from "./PaymentMethod";
import { Supplier } from "./Supplier";
import { SupplierPaymentAllocation } from "./SupplierPaymentAllocation";

@Entity("supplier_payment")
export class SupplierPayment extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_supplier_payment" })
  idSupplierPayment: string;

  @Column({ type: "varchar", length: 20, unique: true, name: "ref" })
  ref: string;

  @Column({ type: "uuid", name: "id_supplier" })
  idSupplier: string;

  @Column({ type: "date", name: "payment_date" })
  paymentDate: Date;

  @Column({ type: "numeric", precision: 15, scale: 2, nullable: true, name: "amount" })
  amount: number;

  @Column({ type: "uuid", name: "id_processed_by" })
  idProcessedBy: string;

  @Column({ type: "uuid", name: "id_payment_method" })
  idPaymentMethod: string;

  @Column({ type: "text", nullable: true, name: "notes" })
  notes: string | null;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: "id_processed_by" })
  processedBy: Employee;

  @ManyToOne(() => PaymentMethod)
  @JoinColumn({ name: "id_payment_method" })
  paymentMethod: PaymentMethod;

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: "id_supplier" })
  supplier: Supplier;

  @OneToMany(() => SupplierPaymentAllocation, (alloc) => alloc.supplierPayment)
  allocations: SupplierPaymentAllocation[];
}
