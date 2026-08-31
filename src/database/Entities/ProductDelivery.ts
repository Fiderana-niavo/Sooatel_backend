import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { DeliveryDetail } from "./DeliveryDetail";
import { PurchaseDelivery } from "./PurchaseDelivery";

@Entity("product_delivery")
export class ProductDelivery extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_delivery" })
  idDelivery: string;

  @Column({ type: "varchar", length: 20, unique: true, name: "ref", insert: false, update: false })
  ref: string;

  @Column({ type: "timestamptz", name: "delivery_date" })
  deliveryDate: Date;

  @Column({ type: "numeric", precision: 15, scale: 2, nullable: true, name: "total_amount" })
  totalAmount: number;

  @Column({ type: "numeric", precision: 15, scale: 2, nullable: true, default: 0, name: "balance_due" })
  balanceDue: number;

  @Column({ type: "integer", nullable: true, name: "status" })
  status: number;

  @Column({ type: "text", nullable: true, name: "notes" })
  notes: string;

  @OneToMany(() => DeliveryDetail, (detail: DeliveryDetail) => detail.productDelivery)
  deliveryDetails: DeliveryDetail[];

  @OneToMany(() => PurchaseDelivery, (pd: PurchaseDelivery) => pd.productDelivery)
  purchaseDeliveries: PurchaseDelivery[];
}

