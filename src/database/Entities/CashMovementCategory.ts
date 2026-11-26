import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("cash_movement_category")
export class CashMovementCategory extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_cash_movement_category" })
  idCashMovementCategory: string;

  @Column({ type: "varchar", length: 80, unique: true, name: "label" })
  label: string;

  @Column({ type: "integer", name: "allowed_direction" })
  allowedDirection: number; // -5 for outflow, 5 for inflow, 0 for both
}
