import { Repository, FindOptionsWhere, IsNull, LessThan } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import AppDataSource from "../../../../database/data-source";
import { CashJournal } from "../../../../database/Entities/CashJournal";
import { PaymentMethodBalance } from "../../../../database/Entities/PaymentMethodBalance";
import { CashMovement } from "../../../../database/Entities/CashMovement";
import { CrudService } from "../../../../shared/crud/services/CrudService";
import { Paginated } from "../../../../shared/types/Paginated";
import { CashJournalDto, CashJournalSearchOptions, OpenJournalDto, CloseJournalDto } from "../type/cash-journal.type";

export class CashJournalService extends CrudService<CashJournal, CashJournalDto, CashJournalDto> {
  constructor(repository: Repository<CashJournal> = AppDataSource.getRepository(CashJournal)) {
    super(repository);
  }

  async findAll(options: CashJournalSearchOptions = {}): Promise<Paginated<CashJournal>> {
    const pageNum = options.page ?? 1;
    const limitNum = options.limit ?? 10;
    const date = options.date;

    const qb = this.repository
      .createQueryBuilder("entity")
      .leftJoinAndSelect("entity.paymentMethodBalances", "pmb")
      .leftJoinAndSelect("pmb.paymentMethod", "pm")
      .leftJoinAndSelect("entity.cashier", "cashier")
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
      relations: { cashier: true, paymentMethodBalances: { paymentMethod: true } }
    });
  }

  async openJournal(dto: OpenJournalDto): Promise<CashJournal> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const openJournal = await queryRunner.manager.findOne(CashJournal, {
        where: { journalClosing: IsNull() }
      });
      if (openJournal) {
        throw new Error("Un journal de caisse est déjà ouvert. Veuillez le fermer avant d'en ouvrir un nouveau.");
      }

      const lastJournal = await queryRunner.manager.findOne(CashJournal, {
        where: { journalClosing: LessThan(new Date()) },
        order: { journalOpening: "DESC" }
      });

      const startingBalance = lastJournal ? Number(lastJournal.expectedClosingBalance) : 0;

      const journal = new CashJournal();
      journal.ref = dto.ref;
      journal.journalOpening = new Date();
      journal.expectedClosingBalance = startingBalance;
      journal.idCashier = dto.idCashier;

      const saved = await queryRunner.manager.save(CashJournal, journal);

      if (lastJournal) {
        const prevBalances = await queryRunner.manager.find(PaymentMethodBalance, {
          where: { idJournal: lastJournal.idJournal }
        });

        if (prevBalances.length > 0) {
          const newBalances = prevBalances.map(b => ({
            idJournal: saved.idJournal,
            idPaymentMethod: b.idPaymentMethod,
            amount: b.amount
          }));
          await queryRunner.manager
            .createQueryBuilder()
            .insert()
            .into(PaymentMethodBalance)
            .values(newBalances)
            .execute();
        }
      }

      await queryRunner.commitTransaction();
      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async closeJournal(idJournal: string, dto: CloseJournalDto): Promise<CashJournal> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const journal = await queryRunner.manager.findOne(CashJournal, {
        where: { idJournal }
      });

      if (!journal) throw new Error("Journal introuvable.");
      if (journal.journalClosing) throw new Error("Ce journal est déjà fermé.");

      const { totalExpected } = await queryRunner.manager
        .createQueryBuilder(PaymentMethodBalance, "pmb")
        .select("COALESCE(SUM(pmb.amount), 0)", "totalExpected")
        .where("pmb.id_journal = :idJournal", { idJournal })
        .getRawOne();

      const expected = Number(totalExpected || 0);
      const actual = dto.actualClosingBalance;

      await queryRunner.manager.update(CashJournal, idJournal, {
        journalClosing: new Date(),
        expectedClosingBalance: expected,
        actualClosingBalance: actual,
        cashDiscrepancy: expected - actual
      } as QueryDeepPartialEntity<CashJournal>);

      await queryRunner.commitTransaction();

      return (await this.repository.findOne({
        where: { idJournal },
        relations: { cashier: true, paymentMethodBalances: { paymentMethod: true } }
      })) as CashJournal;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getJournalMovements(idJournal: string, page = 1, limit = 20): Promise<Paginated<CashMovement>> {
    const repo = AppDataSource.getRepository(CashMovement);
    const [records, total] = await repo
      .createQueryBuilder("cm")
      .leftJoinAndSelect("cm.paymentMethod", "paymentMethod")
      .leftJoinAndSelect("cm.cashMovementCategory", "category")
      .leftJoinAndSelect("cm.processedBy", "processedBy")
      .where("cm.id_journal = :idJournal", { idJournal })
      .orderBy("cm.movementDate", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return new Paginated<CashMovement>(records, total, page, limit);
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
