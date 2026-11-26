import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Purchase } from "./Purchase";
import { SuppliedItem } from "./SuppliedItem";

@Entity("purchase_details")
export class PurchaseDetail extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_purchase_detail" })
  idPurchaseDetail: string;

  @Column({ type: "uuid", name: "id_purchase" })
  idPurchase: string;

  @Column({ type: "uuid", name: "id_supplied_item" })
  idSuppliedItem: string;

  @Column({ type: "numeric", precision: 10, scale: 2, name: "quantity" })
  quantity: number;

  @Column({ type: "numeric", precision: 15, scale: 2, nullable: true, name: "unit_price" })
  unitPrice: number;

  @Column({ type: "numeric", precision: 15, scale: 2, nullable: true, name: "total_amount" })
  totalAmount: number;

  @ManyToOne(() => SuppliedItem)
  @JoinColumn({ name: "id_supplied_item" })
  suppliedItem: SuppliedItem;

  @ManyToOne(() => Purchase)
  @JoinColumn({ name: "id_purchase" })
  purchase: Purchase;
}
