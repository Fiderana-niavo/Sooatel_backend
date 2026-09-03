import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { MenuItem } from "./MenuItem";
import { Sale } from "./Sale";

@Entity("sale_items")
export class SaleItem extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_sale_item" })
  idSaleItem: string;

  @Column({ type: "uuid", name: "id_menu" })
  idMenu: string;

  @Column({ type: "uuid", name: "id_sale" })
  idSale: string;

  @Column({ type: "integer", nullable: true, name: "quantity" })
  quantity: number;

  @Column({ type: "numeric", precision: 15, scale: 2, name: "unit_price" })
  unitPrice: number;

  @Column({ type: "numeric", precision: 15, scale: 2, nullable: true, name: "unit_cost" })
  unitCost: number;

  @Column({ type: "numeric", precision: 15, scale: 2, nullable: true, name: "total_amount" })
  totalAmount: number;

  @ManyToOne(() => MenuItem)
  @JoinColumn({ name: "id_menu" })
  menu: MenuItem;

  @ManyToOne(() => Sale)
  @JoinColumn({ name: "id_sale" })
  sale: Sale;
}
