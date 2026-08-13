import { Repository, FindOptionsWhere } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import AppDataSource from "../../../database/data-source";
import { Item } from "../../../database/Entities/Item";
import { CrudService } from "../../../shared/crud/services/CrudService";
import { Paginated } from "../../../shared/types/Paginated";
import { ItemDto, ItemSearchOptions } from "../type/item.type";

export class ItemService extends CrudService<Item, ItemDto, ItemDto> {
  constructor(repository: Repository<Item> = AppDataSource.getRepository(Item)) {
    super(repository);
  }

  async findAll(options: ItemSearchOptions = {}): Promise<Paginated<Item>> {
    const pageNum = options.page ?? 1;
    const limitNum = options.limit ?? 10;
    const search = options.search ?? "";

    const qb = this.repository
      .createQueryBuilder("entity")
      .skip((pageNum - 1) * limitNum)
      .take(limitNum);
    if (search) {
      qb.andWhere("entity.label ILIKE :s", { s: `%${search}%` });
    }
    if (options.isProduced !== undefined) {
      qb.andWhere("entity.isProduced = :isProduced", { isProduced: options.isProduced });
    }
    
    if (options.unlinkedSupplierId) {
      const subQuery = qb.subQuery()
        .select("si.id_item")
        .from("supplied_items", "si")
        .innerJoin("supplier_products", "sp", "sp.id_supplier_product = si.id_supplier_product")
        .where("sp.id_supplier = :unlinkedSupplierId")
        .getQuery();
        
      qb.andWhere(`entity.idItem NOT IN ${subQuery}`, { unlinkedSupplierId: options.unlinkedSupplierId });
    }

    const [records, total] = await qb.getManyAndCount();
    return new Paginated<Item>(records, total, pageNum, limitNum);
  }

  async findOne(id: string): Promise<Item | null> {
    return this.repository.findOne({
      where: { idItem: id } as FindOptionsWhere<Item>,
    });
  }

  async create(dto: ItemDto): Promise<Item> {
    const entity = this.repository.create({
      ref: dto.ref,
      label: dto.label,
      isProduced: dto.isProduced,
      minimumStockLevel: dto.minimumStockLevel,
      reorderQuantity: dto.reorderQuantity,
      isPerishable: dto.isPerishable,
      status: dto.status,
      idProductType: dto.idProductType,
      idUnit: dto.idUnit,
      description: dto.description,
    });
    return await this.repository.save(entity);
  }

  async update(id: string, dto: ItemDto): Promise<void> {
    await this.repository.update(id, {
      ref: dto.ref,
      label: dto.label,
      isProduced: dto.isProduced,
      minimumStockLevel: dto.minimumStockLevel,
      reorderQuantity: dto.reorderQuantity,
      isPerishable: dto.isPerishable,
      status: dto.status,
      idProductType: dto.idProductType,
      idUnit: dto.idUnit,
      description: dto.description,
    } as QueryDeepPartialEntity<Item>);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
