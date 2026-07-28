import { Repository, FindOptionsWhere } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import AppDataSource from "../../../database/data-source";
import { ItemType } from "../../../database/Entities/ItemType";
import { CrudService } from "../../../shared/crud/services/CrudService";
import { Paginated } from "../../../shared/types/Paginated";
import { ItemTypeDto, ItemTypeSearchOptions } from "../type/item-type.type";

export class ItemTypeService extends CrudService<ItemType, ItemTypeDto, ItemTypeDto> {
  constructor(repository: Repository<ItemType> = AppDataSource.getRepository(ItemType)) {
    super(repository);
  }

  async findAll(options: ItemTypeSearchOptions = {}): Promise<Paginated<ItemType>> {
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

    const [records, total] = await qb.getManyAndCount();
    return new Paginated<ItemType>(records, total, pageNum, limitNum);
  }

  async findOne(id: string): Promise<ItemType | null> {
    return this.repository.findOne({
      where: { idProductType: id } as FindOptionsWhere<ItemType>,
    });
  }

  async create(dto: ItemTypeDto): Promise<ItemType> {
    const entity = this.repository.create({
      label: dto.label,
      description: dto.description,
    });
    return this.repository.save(entity);
  }

  async update(id: string, dto: ItemTypeDto): Promise<void> {
    await this.repository.update(id, {
      label: dto.label,
      description: dto.description,
    } as QueryDeepPartialEntity<ItemType>);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
