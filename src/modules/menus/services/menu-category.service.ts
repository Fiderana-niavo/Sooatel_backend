import { Repository } from "typeorm";
import AppDataSource from "../../../database/data-source";
import { MenuCategory } from "../../../database/Entities/MenuCategory";
import { CrudService } from "../../../shared/crud/services/CrudService";
import { Paginated } from "../../../shared/types/Paginated";
import { MenuCategoryDto, MenuCategorySearchOptions } from "../type/menu-category.type";

export class MenuCategoryService extends CrudService<MenuCategory, MenuCategoryDto, MenuCategoryDto> {
  constructor(repository: Repository<MenuCategory> = AppDataSource.getRepository(MenuCategory)) {
    super(repository);
  }

  async findAll(options: MenuCategorySearchOptions = {}): Promise<Paginated<MenuCategory>> {
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
    return new Paginated<MenuCategory>(records, total, pageNum, limitNum);
  }

  async findOne(id: string): Promise<MenuCategory | null> {
    return this.repository.findOne({
      where: { idCategory: id } as any,
    });
  }

  async create(dto: MenuCategoryDto): Promise<MenuCategory> {
    const entity = this.repository.create({
      label: dto.label,
      description: dto.description,
    });
    return this.repository.save(entity);
  }

  async update(id: string, dto: MenuCategoryDto): Promise<void> {
    await this.repository.update(id, {
      label: dto.label,
      description: dto.description,
    } as any);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
