import { Repository, FindOptionsWhere, ILike } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import AppDataSource from "../../../../database/data-source";
import { CashMovement } from "../../../../database/Entities/CashMovement";
import { PaymentMethodBalance } from "../../../../database/Entities/PaymentMethodBalance";
import { CrudService } from "../../../../shared/crud/services/CrudService";
import { Paginated } from "../../../../shared/types/Paginated";
import { CashJournalService } from "../../cash_journal/services/cash-journal.service";
import { cashMovementDto, cashMovementSearchOptions } from "../type/cash-movement.type";

export class CashMovementService extends CrudService<CashMovement, cashMovementDto, cashMovementDto> {
  constructor(repository: Repository<CashMovement> = AppDataSource.getRepository(CashMovement)) {
    super(repository);
  }

  async findAll(options: cashMovementSearchOptions = {}): Promise<Paginated<CashMovement>> {
    const pageNum = options.page ?? 1;
    const limitNum = options.limit ?? 10;
    const search = options.search ?? "";

    const qb = this.repository
      .createQueryBuilder("entity")
      .leftJoinAndSelect("entity.cashMovementCategory", "category")
      .leftJoinAndSelect("entity.paymentMethod", "paymentMethod")
      .where("entity.status IS DISTINCT FROM -3");

    if (options.direction) {
      qb.andWhere("entity.direction = :dir", { dir: options.direction });
    }

    qb.orderBy("entity.movementDate", "DESC")
      .skip((pageNum - 1) * limitNum)
      .take(limitNum);

    if (search) {
      qb.andWhere("entity.invoiceReference ILIKE :s OR entity.reason ILIKE :s", { s: `%${search}%` });
    }

    const [records, total] = await qb.getManyAndCount();
    return new Paginated<CashMovement>(records, total, pageNum, limitNum);
  }

  async findOne(id: string): Promise<CashMovement | null> {
    return this.repository.findOne({
      where: { idCashMovement: id } as FindOptionsWhere<CashMovement>,
      relations: { cashMovementCategory: true, processedBy: true, journal: true, paymentMethod: true }
    });
  }

  async create(dto: cashMovementDto): Promise<CashMovement> {
    if (dto.direction < 0) {
      const pmb = await this.repository.manager.findOne(PaymentMethodBalance, {
        where: { idJournal: dto.idJournal, idPaymentMethod: dto.idPaymentMethod }
      });
      const currentBalance = pmb ? Number(pmb.amount) : 0;
      if (currentBalance < dto.amount) {
        throw new Error(`Fonds insuffisants pour ce mode de paiement. Solde disponible : ${currentBalance} Ar.`);
      }
    }

    const entity = this.repository.create({
      ref: dto.ref || undefined,
      amount: dto.amount,
      movementDate: dto.movementDate,
      reason: dto.reason,
      invoiceReference: dto.invoiceReference,
      direction: dto.direction,
      idProcessedBy: dto.idProcessedBy,
      idJournal: dto.idJournal,
      status: dto.status ?? 0,
      idCashMovementCategory: dto.idCashMovementCategory,
      idPaymentMethod: dto.idPaymentMethod,
    });
    const saved = await this.repository.save(entity);
    const journalService = new CashJournalService();
    await journalService.recalculateBalances(saved.idJournal);
    return saved;
  }

  async update(id: string, dto: cashMovementDto): Promise<void> {
    const existing = await this.repository.findOneBy({ idCashMovement: id });
    if (!existing) throw new Error("Mouvement de caisse introuvable.");

    if (
      existing.reason === "Journalisation des ventes" ||
      existing.reason?.toLowerCase().includes("remboursement") ||
      existing.reason?.toLowerCase().includes("ajustement")
    ) {
      throw new Error("Ce type de mouvement (Journalisation, Remboursement, Ajustement) ne peut pas être modifié.");
    }

    if (dto.direction < 0) {
      // Check if the balance is sufficient for the updated amount
      const pmb = await this.repository.manager.findOne(PaymentMethodBalance, {
        where: { idJournal: dto.idJournal, idPaymentMethod: dto.idPaymentMethod }
      });
      const currentBalance = pmb ? Number(pmb.amount) : 0;
      
      // If payment method hasn't changed, we can add back the old amount before checking
      const oldAmount = (existing.idPaymentMethod === dto.idPaymentMethod && existing.direction < 0) ? Number(existing.amount) : 0;
      
      if (currentBalance + oldAmount < dto.amount) {
        throw new Error(`Fonds insuffisants. Vous ne pouvez pas sortir plus que le solde disponible (${currentBalance + oldAmount} Ar).`);
      }
    }

    await this.repository.update(id, {
      ref: dto.ref,
      amount: dto.amount,
      movementDate: dto.movementDate,
      reason: dto.reason,
      invoiceReference: dto.invoiceReference,
      direction: dto.direction,
      idProcessedBy: dto.idProcessedBy,
      idJournal: dto.idJournal,
      status: dto.status,
      idCashMovementCategory: dto.idCashMovementCategory,
      idPaymentMethod: dto.idPaymentMethod,
    } as QueryDeepPartialEntity<CashMovement>);
    
    const journalService = new CashJournalService();
    await journalService.recalculateBalances(dto.idJournal);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.repository.findOneBy({ idCashMovement: id });
    if (!existing) throw new Error("Mouvement de caisse introuvable.");

    if (
      existing.reason === "Journalisation des ventes" ||
      existing.reason?.toLowerCase().includes("remboursement") ||
      existing.reason?.toLowerCase().includes("ajustement")
    ) {
      throw new Error("Ce type de mouvement (Journalisation, Remboursement, Ajustement) ne peut pas être supprimé.");
    }

    await this.repository.update(id, {
      status: -3
    } as QueryDeepPartialEntity<CashMovement>);

    const journalService = new CashJournalService();
    await journalService.recalculateBalances(existing.idJournal);
  }
}
