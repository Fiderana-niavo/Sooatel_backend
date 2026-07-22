import { Repository } from "typeorm";
import AppDataSource from "../../../database/data-source";
import { MenuItem } from "../../../database/Entities/MenuItem";
import { CrudService } from "../../../shared/crud/services/CrudService";
import { Paginated } from "../../../shared/types/Paginated";
import { MenuItemDto, MenuItemSearchOptions } from "../type/menu-item.type";

export class MenuItemService extends CrudService<MenuItem, MenuItemDto, MenuItemDto> {
  constructor(repository: Repository<MenuItem> = AppDataSource.getRepository(MenuItem)) {
    super(repository);
  }

  async findAll(options: MenuItemSearchOptions = {}): Promise<Paginated<MenuItem>> {
    const pageNum = options.page ?? 1;
    const limitNum = options.limit ?? 10;
    const search = options.search ?? "";

    const qb = this.repository
      .createQueryBuilder("entity")
      .skip((pageNum - 1) * limitNum)
      .take(limitNum);
    if (search) {
      qb.andWhere("entity.ref ILIKE :s", { s: `%${search}%` });
    }
    if (options.idCategory) {
      qb.andWhere("entity.idCategory = :idCategory", { idCategory: options.idCategory });
    }

    const [records, total] = await qb.getManyAndCount();
    return new Paginated<MenuItem>(records, total, pageNum, limitNum);
  }

  async findOne(id: string): Promise<MenuItem | null> {
    return this.repository.findOne({
      where: { idMenu: id } as any,
    });
  }

  async create(dto: MenuItemDto): Promise<MenuItem> {
    const entity = this.repository.create({
      ref: dto.ref,
      idItem: dto.idItem,
      salePrice: dto.salePrice,
      recipeCost: dto.recipeCost,
      idCategory: dto.idCategory,
    });
    return this.repository.save(entity);
  }

  async update(id: string, dto: MenuItemDto): Promise<void> {
    await this.repository.update(id, {
      ref: dto.ref,
      idItem: dto.idItem,
      salePrice: dto.salePrice,
      recipeCost: dto.recipeCost,
      idCategory: dto.idCategory,
    } as any);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
