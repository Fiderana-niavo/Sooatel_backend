import { Repository } from "typeorm";
import AppDataSource from "../../../database/data-source";
import { ShiftType } from "../../../database/Entities/ShiftType";
import { CrudService } from "../../../shared/crud/services/CrudService";
import { Paginated } from "../../../shared/types/Paginated";
import { ShiftTypeDto, ShiftTypeSearchOptions } from "../type/shift-type.type";

export class ShiftTypeService extends CrudService<ShiftType, ShiftTypeDto, ShiftTypeDto> {
  constructor(repository: Repository<ShiftType> = AppDataSource.getRepository(ShiftType)) {
    super(repository);
  }

  async findAll(options: ShiftTypeSearchOptions = {}): Promise<Paginated<ShiftType>> {
    const pageNum = options.page ?? 1;
    const limitNum = options.limit ?? 10;
    const search = options.search ?? "";

    const qb = this.repository
      .createQueryBuilder("shift")
      .skip((pageNum - 1) * limitNum)
      .take(limitNum);

    if (search) {
      qb.andWhere("shift.label ILIKE :s", { s: `%${search}%` });
    }

    const [records, total] = await qb.getManyAndCount();
    return new Paginated<ShiftType>(records, total, pageNum, limitNum);
  }

  async findOne(id: string): Promise<ShiftType | null> {
    return this.repository.findOne({
      where: { idShiftType: id },
    });
  }

  async create(dto: ShiftTypeDto): Promise<ShiftType> {
    const existing = await this.repository.findOne({
      where: { label: dto.label },
    });
    if (existing) {
      throw new Error("Un type de shift avec ce nom existe déjà.");
    }
    const shift = this.repository.create({
      label: dto.label,
      customStartTime: dto.customStartTime,
      customEndTime: dto.customEndTime,
      description: dto.description,
    });
    return this.repository.save(shift);
  }

  async update(id: string, dto: ShiftTypeDto): Promise<void> {
    const existing = await this.repository.findOne({
      where: { label: dto.label },
    });
    if (existing && existing.idShiftType !== id) {
      throw new Error("Un type de shift avec ce nom existe déjà.");
    }
    await this.repository.update(id, {
      label: dto.label,
      customStartTime: dto.customStartTime,
      customEndTime: dto.customEndTime,
      description: dto.description,
    });
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
