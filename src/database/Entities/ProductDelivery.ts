import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Purchase } from "./Purchase";
import { DeliveryDetail } from "./DeliveryDetail";

@Entity("product_delivery")
export class ProductDelivery extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_delivery" })
  idDelivery: string;

  @Column({ type: "varchar", length: 20, unique: true, name: "ref" })
  ref: string;

  @Column({ type: "timestamptz", name: "delivery_date" })
  deliveryDate: Date;

  @Column({ type: "numeric", precision: 15, scale: 2, nullable: true, name: "total_amount" })
  totalAmount: number;

  @Column({ type: "integer", nullable: true, name: "status" })
  status: number;

  @Column({ type: "text", nullable: true, name: "notes" })
  notes: string;

  @Column({ type: "uuid", name: "id_purchase" })
  idPurchase: string;

  @ManyToOne(() => Purchase)
  @JoinColumn({ name: "id_purchase" })
  purchase: Purchase;

  @OneToMany(() => DeliveryDetail, (deliveryDetail: DeliveryDetail) => deliveryDetail.productDelivery)
  deliveryDetails: DeliveryDetail[];
}
