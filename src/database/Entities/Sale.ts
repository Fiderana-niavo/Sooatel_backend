import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Employee } from "./Employee";
import { Room } from "./Room";
import { SaleItem } from "./SaleItem";
import { User } from "./User";
import { Invoice } from "./Invoice";

@Entity("sales")
export class Sale extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_sale" })
  idSale: string;

  @Column({ type: "varchar", length: 20, unique: true, name: "ref" })
  ref: string;

  @Column({ type: "date", name: "sale_date" })
  saleDate: Date;

  @Column({ type: "numeric", precision: 15, scale: 2, nullable: true, name: "total_amount" })
  totalAmount: number | null;

  @Column({ type: "text", nullable: true, name: "comment" })
  comment: string | null;

  @Column({ type: "timestamptz", nullable: true, name: "delivery_date" })
  deliveryDate: Date | null;


  @Column({ type: "integer", nullable: true, name: "table_number" })
  tableNumber: number | null;

  @Column({ type: "boolean", nullable: true, name: "charge_to_room" })
  chargeToRoom: boolean | null;

  @Column({ type: "uuid", nullable: true, name: "id_room" })
  idRoom: string | null;

  @Column({ type: "uuid", name: "id_saler" })
  idSaler: string;

  @Column({ type: "uuid", nullable: true, name: "id_invoice" })
  idInvoice: string | null;

  @Column({ type: "integer", nullable: true, name: "status" })
  status: number | null;

  @Column({ type: "uuid", nullable: true, name: "created_by" })
  createdBy: string | null;

  @Column({ type: "uuid", nullable: true, name: "updated_by" })
  updatedBy: string | null;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz", nullable: true, name: "updated_at" })
  updatedAt: Date;

  @OneToMany(() => SaleItem, (item) => item.sale)
  saleItems: SaleItem[];

  @ManyToOne(() => Room)
  @JoinColumn({ name: "id_room" })
  room: Room;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: "id_saler" })
  saler: Employee;

  @ManyToOne(() => User)
  @JoinColumn({ name: "created_by" })
  creator: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: "updated_by" })
  updatedByUser: User;

  @ManyToOne(() => Invoice)
  @JoinColumn({ name: "id_invoice" })
  invoice: Invoice;
}
