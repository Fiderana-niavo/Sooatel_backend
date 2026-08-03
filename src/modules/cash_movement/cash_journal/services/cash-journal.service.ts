import { Repository, FindOptionsWhere, ILike } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import AppDataSource from "../../../../database/data-source";
import { CashJournal } from "../../../../database/Entities/CashJournal";
import { CrudService } from "../../../../shared/crud/services/CrudService";
import { Paginated } from "../../../../shared/types/Paginated";
import { CashJournalDto, CashJournalSearchOptions } from "../type/cash-journal.type";

export class CashJournalService extends CrudService<CashJournal, CashJournalDto, CashJournalDto> {
  constructor(repository: Repository<CashJournal> = AppDataSource.getRepository(CashJournal)) {
    super(repository);
  }

  async findAll(options: CashJournalSearchOptions = {}): Promise<Paginated<CashJournal>> {
    const pageNum = options.page ?? 1;
    const limitNum = options.limit ?? 100;
    const date = options.date;

    const qb = this.repository
      .createQueryBuilder("entity")
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .orderBy("entity.journalOpening", "DESC");

    if (date) {
      qb.andWhere("DATE(entity.journalOpening) = :date", { date });
    }

    const [records, total] = await qb.getManyAndCount();
    return new Paginated<CashJournal>(records, total, pageNum, limitNum);
  }

  async findOne(id: string): Promise<CashJournal | null> {
    return this.repository.findOne({
      where: { idJournal: id } as FindOptionsWhere<CashJournal>,
      relations: { cashier: true }
    });
  }

  async create(dto: CashJournalDto): Promise<CashJournal> {
    const entity = this.repository.create({
      ref: dto.ref,
      journalOpening: dto.journalOpening,
      journalClosing: dto.journalClosing,
      expectedClosingBalance: dto.expectedClosingBalance,
      actualClosingBalance: dto.actualClosingBalance,
      cashDiscrepancy: dto.cashDiscrepancy,
      idCashier: dto.idCashier,
    } as unknown as import("typeorm").DeepPartial<CashJournal>);
    return this.repository.save(entity);
  }

  async update(id: string, dto: CashJournalDto): Promise<void> {
    await this.repository.update(id, {
      ref: dto.ref,
      journalOpening: dto.journalOpening,
      journalClosing: dto.journalClosing,
      expectedClosingBalance: dto.expectedClosingBalance,
      actualClosingBalance: dto.actualClosingBalance,
      cashDiscrepancy: dto.cashDiscrepancy,
      idCashier: dto.idCashier,
    } as unknown as QueryDeepPartialEntity<CashJournal>);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
