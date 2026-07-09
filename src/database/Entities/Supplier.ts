import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("supplier")
export class Supplier extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_supplier" })
  idSupplier: string;

  @Column({ type: "varchar", length: 20, unique: true, name: "ref" })
  ref: string;

  @Column({ type: "varchar", length: 100, name: "name" })
  name: string;

  @Column({ type: "varchar", length: 100, nullable: true, name: "address" })
  address: string;

  @Column({ type: "varchar", length: 255, nullable: true, name: "description" })
  description: string;

  @Column({ type: "boolean", nullable: true, name: "provides_delivery" })
  providesDelivery: boolean;

  @Column({ type: "numeric", precision: 5, scale: 2, nullable: true, name: "delivery_delay" })
  deliveryDelay: number;

  @Column({ type: "varchar", length: 255, nullable: true, name: "notes" })
  notes: string;

  @Column({ type: "varchar", length: 20, nullable: true, name: "phone_number" })
  phoneNumber: string;

  @Column({ type: "varchar", length: 100, nullable: true, name: "email" })
  email: string;
}
