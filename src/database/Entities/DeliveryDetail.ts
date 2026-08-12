import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ProductDelivery } from "./ProductDelivery";
import { SuppliedItem } from "./SuppliedItem";

@Entity("delivery_details")
export class DeliveryDetail extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_detail" })
  idDetail: string;

  @Column({ type: "numeric", precision: 10, scale: 2, name: "quantity" })
  quantity: number;

  @Column({ type: "numeric", precision: 15, scale: 2, name: "unit_price" })
  unitPrice: number;

  @Column({ type: "numeric", precision: 15, scale: 2, nullable: true, name: "total_amount" })
  totalAmount: number;

  @Column({ type: "uuid", name: "id_supplied_item" })
  idSuppliedItem: string;

  @Column({ type: "uuid", name: "id_delivery" })
  idDelivery: string;

  @ManyToOne(() => SuppliedItem)
  @JoinColumn({ name: "id_supplied_item" })
  suppliedItem: SuppliedItem;

  @ManyToOne(() => ProductDelivery, (productDelivery: ProductDelivery) => productDelivery.deliveryDetails)
  @JoinColumn({ name: "id_delivery" })
  productDelivery: ProductDelivery;
}
