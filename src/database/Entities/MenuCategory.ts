import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("menu_categories")
export class MenuCategory extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id_category" })
  idCategory: string;

  @Column({ type: "varchar", length: 100, unique: true, name: "label" })
  label: string;

  @Column({ type: "varchar", length: 255, nullable: true, name: "description" })
  description: string;
}
