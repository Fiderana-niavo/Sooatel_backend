import { Repository } from "typeorm";
import AppDataSource from "../../../database/data-source";
import { UnitOfMeasure } from "../../../database/Entities/UnitOfMeasure";
import { CrudService } from "../../../shared/crud/services/CrudService";
import { Paginated } from "../../../shared/types/Paginated";
import { UnitOfMeasureDto, UnitOfMeasureSearchOptions } from "../type/unit-of-measure.type";

export class UnitOfMeasureService extends CrudService<UnitOfMeasure, UnitOfMeasureDto, UnitOfMeasureDto> {
  constructor(repository: Repository<UnitOfMeasure> = AppDataSource.getRepository(UnitOfMeasure)) {
    super(repository);
  }

  async findAll(options: UnitOfMeasureSearchOptions = {}): Promise<Paginated<UnitOfMeasure>> {
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
    return new Paginated<UnitOfMeasure>(records, total, pageNum, limitNum);
  }

  async findOne(id: string): Promise<UnitOfMeasure | null> {
    return this.repository.findOne({
      where: { idUnit: id } as any,
    });
  }

  async create(dto: UnitOfMeasureDto): Promise<UnitOfMeasure> {
    const entity = this.repository.create({
      label: dto.label,
      symbol: dto.symbol,
    });
    return this.repository.save(entity);
  }

  async update(id: string, dto: UnitOfMeasureDto): Promise<void> {
    await this.repository.update(id, {
      label: dto.label,
      symbol: dto.symbol,
    } as any);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
