import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";
import { Payment } from "./Payment";

@Entity("invoice")
export class Invoice extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_invoice" })
  idInvoice: string;

  @Column({
    type: "varchar",
    length: 30,
    unique: true,
    name: "invoice_number_system",
  })
  invoiceNumberSystem: string;

  @Column({
    type: "varchar",
    length: 20,
    unique: true,
    nullable: true,
    name: "invoice_number",
  })
  invoiceNumber: string | null;

  @Column({
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
    name: "invoice_date",
  })
  invoiceDate: Date;

  @Column({
    type: "numeric",
    precision: 15,
    scale: 2,
    default: 0,
    name: "total_amount",
  })
  totalAmount: number;

  @Column({
    type: "numeric",
    precision: 15,
    scale: 2,
    default: 0,
    name: "balance_due",
  })
  balanceDue: number;

  @Column({
    type: "integer",
    default: 5,
    name: "status",
  })
  status: number;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;

  @Column({ type: "uuid", nullable: true, name: "created_by" })
  createdBy: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: "created_by" })
  creator: User;

  @OneToMany(() => Payment, (payment) => payment.invoice)
  payments: Payment[];
}
