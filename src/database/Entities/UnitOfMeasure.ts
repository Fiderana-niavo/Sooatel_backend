import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("unit_of_measure")
export class UnitOfMeasure extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_unit" })
  idUnit: string;

  @Column({ type: "varchar", length: 50, nullable: true, name: "label" })
  label: string;

  @Column({ type: "varchar", length: 10, nullable: true, name: "symbol" })
  symbol: string;
}
