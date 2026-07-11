import { Repository } from "typeorm";
import AppDataSource from "../../../database/data-source";
import { PermissionCategory } from "../../../database/Entities/PermissionCategory";
import { CrudService } from "../../../shared/crud/services/CrudService";
import { Paginated } from "../../../shared/types/Paginated";
import { PermissionCategoryDto, PermissionCategorySearchOptions } from "../type/permission.type";

export class PermissionCategoryService extends CrudService<
  PermissionCategory,
  PermissionCategoryDto,
  PermissionCategoryDto
> {
  constructor(
    repository: Repository<PermissionCategory> = AppDataSource.getRepository(PermissionCategory),
  ) {
    super(repository);
  }

  async findAll(
    options: PermissionCategorySearchOptions = {},
  ): Promise<Paginated<PermissionCategory>> {
    const pageNum = options.page ?? 1;
    const limitNum = options.limit ?? 10;
    const search = options.search ?? "";
    const sortBy = options.sortBy ?? "name";
    const sortOrder = options.sortOrder ?? "ASC";

    const qb = this.repository
      .createQueryBuilder("category")
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .orderBy(`category.${sortBy}`, sortOrder);

    if (search) {
      qb.andWhere("(category.name ILIKE :s OR category.code ILIKE :s)", { s: `%${search}%` });
    }

    const [records, total] = await qb.getManyAndCount();
    return new Paginated<PermissionCategory>(records, total, pageNum, limitNum);
  }

  async findOne(id: string): Promise<PermissionCategory | null> {
    return this.repository.findOne({ where: { idCategory: id } });
  }

  async create(dto: PermissionCategoryDto): Promise<PermissionCategory> {
    const existing = await this.repository.findOne({ where: { code: dto.code } });
    if (existing) throw new Error("Une catégorie avec ce code existe déjà.");
    const category = this.repository.create({
      name: dto.name,
      code: dto.code,
    });
    return this.repository.save(category);
  }

  async update(id: string, dto: PermissionCategoryDto): Promise<void> {
    await this.repository.update(id, {
      name: dto.name,
      code: dto.code,
    });
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
