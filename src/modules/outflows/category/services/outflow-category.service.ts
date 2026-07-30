import { Repository, FindOptionsWhere, ILike } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import AppDataSource from "../../../../database/data-source";
import { OutflowCategory } from "../../../../database/Entities/OutflowCategory";
import { CrudService } from "../../../../shared/crud/services/CrudService";
import { Paginated } from "../../../../shared/types/Paginated";
import { OutflowCategoryDto, OutflowCategorySearchOptions } from "../type/outflow-category.type";

export class OutflowCategoryService extends CrudService<OutflowCategory, OutflowCategoryDto, OutflowCategoryDto> {
  constructor(repository: Repository<OutflowCategory> = AppDataSource.getRepository(OutflowCategory)) {
    super(repository);
  }

  async findAll(options: OutflowCategorySearchOptions = {}): Promise<Paginated<OutflowCategory>> {
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
    return new Paginated<OutflowCategory>(records, total, pageNum, limitNum);
  }

  async findOne(id: string): Promise<OutflowCategory | null> {
    return this.repository.findOne({
      where: { idOutflowCategory: id } as FindOptionsWhere<OutflowCategory>,
    });
  }

  async create(dto: OutflowCategoryDto): Promise<OutflowCategory> {
    const entity = this.repository.create({
      label: dto.label,
      code: dto.code || null,
    });
    return this.repository.save(entity);
  }

  async update(id: string, dto: OutflowCategoryDto): Promise<void> {
    await this.repository.update(id, {
      label: dto.label,
      code: dto.code || null,
    } as QueryDeepPartialEntity<OutflowCategory>);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
