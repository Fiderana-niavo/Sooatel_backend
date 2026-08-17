import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Purchase } from "./Purchase";
import { ProductDelivery } from "./ProductDelivery";

@Entity("purchase_delivery")
export class PurchaseDelivery extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_purchase_delivery" })
  idPurchaseDelivery: string;

  @Column({ type: "uuid", name: "id_purchase" })
  idPurchase: string;

  @Column({ type: "uuid", name: "id_delivery" })
  idDelivery: string;

  @ManyToOne(() => Purchase)
  @JoinColumn({ name: "id_purchase" })
  purchase: Purchase;

  @ManyToOne(() => ProductDelivery, (delivery: ProductDelivery) => delivery.purchaseDeliveries)
  @JoinColumn({ name: "id_delivery" })
  productDelivery: ProductDelivery;
}
