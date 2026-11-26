import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("item_type")
export class ItemType extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_product_type" })
  idProductType: string;

  @Column({ type: "varchar", length: 100, nullable: true, name: "label" })
  label: string;

  @Column({ type: "varchar", length: 255, nullable: true, name: "description" })
  description: string;
}
