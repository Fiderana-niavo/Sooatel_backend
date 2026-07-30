import { Repository, FindOptionsWhere, ILike } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import AppDataSource from "../../../../database/data-source";
import { CashOutflow } from "../../../../database/Entities/CashOutflow";
import { CrudService } from "../../../../shared/crud/services/CrudService";
import { Paginated } from "../../../../shared/types/Paginated";
import { CashOutflowDto, CashOutflowSearchOptions } from "../type/cash-outflow.type";

export class CashOutflowService extends CrudService<CashOutflow, CashOutflowDto, CashOutflowDto> {
  constructor(repository: Repository<CashOutflow> = AppDataSource.getRepository(CashOutflow)) {
    super(repository);
  }

  async findAll(options: CashOutflowSearchOptions = {}): Promise<Paginated<CashOutflow>> {
    const pageNum = options.page ?? 1;
    const limitNum = options.limit ?? 10;
    const search = options.search ?? "";

    const qb = this.repository
      .createQueryBuilder("entity")
      .leftJoinAndSelect("entity.outflowCategory", "category")
      .where("entity.status IS DISTINCT FROM -3")
      .skip((pageNum - 1) * limitNum)
      .take(limitNum);

    if (search) {
      qb.andWhere("entity.invoiceReference ILIKE :s OR entity.reason ILIKE :s", { s: `%${search}%` });
    }

    const [records, total] = await qb.getManyAndCount();
    return new Paginated<CashOutflow>(records, total, pageNum, limitNum);
  }

  async findOne(id: string): Promise<CashOutflow | null> {
    return this.repository.findOne({
      where: { idCashOutflows: id } as FindOptionsWhere<CashOutflow>,
      relations: { outflowCategory: true, processedBy: true, journal: true }
    });
  }

  async create(dto: CashOutflowDto): Promise<CashOutflow> {
    const entity = this.repository.create({
      ref: dto.ref || undefined,
      amount: dto.amount,
      outflowDate: dto.outflowDate,
      reason: dto.reason,
      invoiceReference: dto.invoiceReference,
      idProcessedBy: dto.idProcessedBy,
      idJournal: dto.idJournal,
      status: dto.status,
      idOutflowCategory: dto.idOutflowCategory,
    });
    return this.repository.save(entity);
  }

  async update(id: string, dto: CashOutflowDto): Promise<void> {
    await this.repository.update(id, {
      ref: dto.ref,
      amount: dto.amount,
      outflowDate: dto.outflowDate,
      reason: dto.reason,
      invoiceReference: dto.invoiceReference,
      idProcessedBy: dto.idProcessedBy,
      idJournal: dto.idJournal,
      status: dto.status,
      idOutflowCategory: dto.idOutflowCategory,
    } as QueryDeepPartialEntity<CashOutflow>);
  }

  async delete(id: string): Promise<void> {
    await this.repository.update(id, {
      status: -3
    } as QueryDeepPartialEntity<CashOutflow>);
  }
}
