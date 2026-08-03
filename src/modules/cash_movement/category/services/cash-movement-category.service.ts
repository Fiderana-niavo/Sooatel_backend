import { Repository, FindOptionsWhere, ILike } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import AppDataSource from "../../../../database/data-source";
import { CashMovementCategory } from "../../../../database/Entities/CashMovementCategory";
import { CrudService } from "../../../../shared/crud/services/CrudService";
import { Paginated } from "../../../../shared/types/Paginated";
import { CashMovementCategoryDto, CashMovementCategorySearchOptions } from "../type/cash-movement-category.type";

export class CashMovementCategoryService extends CrudService<CashMovementCategory, CashMovementCategoryDto, CashMovementCategoryDto> {
  constructor(repository: Repository<CashMovementCategory> = AppDataSource.getRepository(CashMovementCategory)) {
    super(repository);
  }

  async findAll(options: CashMovementCategorySearchOptions = {}): Promise<Paginated<CashMovementCategory>> {
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
    return new Paginated<CashMovementCategory>(records, total, pageNum, limitNum);
  }

  async findOne(id: string): Promise<CashMovementCategory | null> {
    return this.repository.findOne({
      where: { idCashMovementCategory: id } as FindOptionsWhere<CashMovementCategory>,
    });
  }

  async create(dto: CashMovementCategoryDto): Promise<CashMovementCategory> {
    const entity = this.repository.create({
      label: dto.label,
      allowedDirection: dto.allowedDirection,
    });
    return this.repository.save(entity);
  }

  async update(id: string, dto: CashMovementCategoryDto): Promise<void> {
    await this.repository.update(id, {
      label: dto.label,
      allowedDirection: dto.allowedDirection,
    } as QueryDeepPartialEntity<CashMovementCategory>);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
