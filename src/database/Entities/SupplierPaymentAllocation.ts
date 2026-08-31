import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { SupplierPayment } from "./SupplierPayment";
import { ProductDelivery } from "./ProductDelivery";
import { Purchase } from "./Purchase";

export type AllocationType = "DELIVERY" | "SUPPLIER_CREDIT";

@Entity("supplier_payment_allocation")
export class SupplierPaymentAllocation extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_allocation" })
  idAllocation: string;

  @Column({ type: "uuid", name: "id_supplier_payment" })
  idSupplierPayment: string;

  @Column({ type: "varchar", length: 20, name: "allocation_type" })
  allocationType: AllocationType;

  @Column({ type: "uuid", name: "id_delivery", nullable: true })
  idDelivery: string | null;


  @Column({ type: "numeric", precision: 15, scale: 2, name: "amount" })
  amount: number;

  @ManyToOne(() => SupplierPayment, (payment) => payment.allocations)
  @JoinColumn({ name: "id_supplier_payment" })
  supplierPayment: SupplierPayment;

  @ManyToOne(() => ProductDelivery)
  @JoinColumn({ name: "id_delivery" })
  delivery: ProductDelivery;

}
