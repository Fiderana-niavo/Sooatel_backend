import AppDataSource from "../../../database/data-source";
import { StockMovement } from "../../../database/Entities/StockMovement";
import { Item } from "../../../database/Entities/Item";
import { BadRequestError, NotFoundError } from "../../../shared/errors/AppError";
import { Paginated } from "../../../shared/types/Paginated";
import { STOCK_MOVEMENT_STATUS, STOCK_MOVEMENT_TYPE, STOCK_MOVEMENT_DIRECTION } from "../../items/constants/stock.constants";
import type { StockMovementDto, StockMovementSearchOptions, LossDto, InventoryLineDto } from "../type/stock-movement.type";

export class StockMovementService {
  private repository = AppDataSource.getRepository(StockMovement);
  private itemRepository = AppDataSource.getRepository(Item);

  async findAll(options: StockMovementSearchOptions = {}): Promise<Paginated<unknown>> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;

    const qb = this.repository
      .createQueryBuilder("mvt")
      .select([
        "mvt.idStockMovement",
        "mvt.ref",
        "mvt.movementDate",
        "mvt.quantity",
        "mvt.direction",
        "mvt.status",
        "mvt.movementType",
        "mvt.reason",
        "item.idItem",
        "item.label",
        "item.ref",
        "operator.idEmployee",
        "operator.name",
        "operator.lastname",
      ])
      .leftJoin("mvt.item", "item")
      .leftJoin("mvt.operator", "operator");

    if (options.idItem) {
      qb.andWhere("mvt.idItem = :idItem", { idItem: options.idItem });
    }
    if (options.direction !== undefined) {
      qb.andWhere("mvt.direction = :direction", { direction: options.direction });
    }
    if (options.status !== undefined) {
      qb.andWhere("mvt.status = :status", { status: options.status });
    }
    if (options.movementType !== undefined) {
      qb.andWhere("mvt.movementType = :movementType", { movementType: options.movementType });
    }
    if (options.startDate) {
      qb.andWhere("mvt.movementDate >= :startDate", { startDate: options.startDate });
    }
    if (options.endDate) {
      qb.andWhere("mvt.movementDate <= :endDate", { endDate: options.endDate });
    }

    qb.orderBy("mvt.movementDate", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    const [records, total] = await qb.getManyAndCount();
    return new Paginated(records, total, page, limit);
  }

  async create(dto: StockMovementDto, idOperator: string): Promise<StockMovement> {
    const item = await this.itemRepository.findOne({ where: { idItem: dto.idItem } });
    if (!item) throw new NotFoundError("Article introuvable.");

    const movement = this.repository.create({
      idItem: dto.idItem,
      quantity: dto.quantity,
      direction: dto.direction,
      reason: dto.reason,
      movementDate: dto.movementDate ? new Date(dto.movementDate) : new Date(),
      movementType: STOCK_MOVEMENT_TYPE.MANUEL,
      idOperator,
      status: STOCK_MOVEMENT_STATUS.DRAFT,
    });

    return this.repository.save(movement);
  }

  async update(id: string, dto: StockMovementDto): Promise<void> {
    const movement = await this.repository.findOne({ where: { idStockMovement: id } });
    if (!movement) throw new NotFoundError("Mouvement introuvable.");
    if (movement.status === STOCK_MOVEMENT_STATUS.VALIDATED) {
      throw new BadRequestError("Impossible de modifier un mouvement validé.");
    }

    await this.repository.update(id, {
      idItem: dto.idItem,
      quantity: dto.quantity,
      direction: dto.direction,
      reason: dto.reason,
      movementDate: dto.movementDate ? new Date(dto.movementDate) : movement.movementDate,
    });
  }

  async delete(id: string): Promise<void> {
    const movement = await this.repository.findOne({ where: { idStockMovement: id } });
    if (!movement) throw new NotFoundError("Mouvement introuvable.");
    if (movement.status === STOCK_MOVEMENT_STATUS.VALIDATED) {
      throw new BadRequestError("Impossible de supprimer un mouvement validé.");
    }
    await this.repository.delete(id);
  }

  async validate(id: string, idOperator: string): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const movement = await queryRunner.manager.findOne(StockMovement, { where: { idStockMovement: id } });
      if (!movement) throw new NotFoundError("Mouvement introuvable.");
      if (movement.status === STOCK_MOVEMENT_STATUS.VALIDATED) {
        throw new BadRequestError("Mouvement déjà validé.");
      }

      const item = await queryRunner.manager.findOne(Item, { where: { idItem: movement.idItem } });
      if (!item) throw new NotFoundError("Article introuvable.");

      const qty = Number(movement.quantity);
      const currentStock = Number(item.quantity ?? 0);

      if (movement.direction === STOCK_MOVEMENT_DIRECTION.OUT) {
        if (currentStock < qty) {
          throw new BadRequestError(
            `Stock insuffisant. Disponible : ${currentStock}, demandé : ${qty}.`
          );
        }
        item.quantity = currentStock - qty;
      } else {
        item.quantity = currentStock + qty;
      }

      await queryRunner.manager.save(Item, item);
      await queryRunner.manager.update(StockMovement, id, {
        status: STOCK_MOVEMENT_STATUS.VALIDATED,
        idOperator,
      });

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // Record a validated loss movement immediately (no draft step)
  async recordLoss(dto: LossDto, idOperator: string): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const item = await queryRunner.manager.findOne(Item, { where: { idItem: dto.idItem } });
      if (!item) throw new NotFoundError("Article introuvable.");

      const qty = Number(dto.quantity);
      const currentStock = Number(item.quantity ?? 0);

      if (currentStock < qty) {
        throw new BadRequestError(
          `Stock insuffisant pour enregistrer la perte. Disponible : ${currentStock}, perte déclarée : ${qty}.`
        );
      }

      item.quantity = currentStock - qty;

      const movement = queryRunner.manager.create(StockMovement, {
        idItem: dto.idItem,
        quantity: qty,
        direction: STOCK_MOVEMENT_DIRECTION.OUT,
        reason: dto.reason,
        movementDate: dto.movementDate ? new Date(dto.movementDate) : new Date(),
        movementType: STOCK_MOVEMENT_TYPE.PERTE,
        idOperator,
        status: STOCK_MOVEMENT_STATUS.VALIDATED,
      });

      await queryRunner.manager.save(Item, item);
      await queryRunner.manager.save(StockMovement, movement);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // Submit a physical inventory: compare physical qty vs theoretical, create adjustment movements
  async submitInventory(lines: InventoryLineDto[], idOperator: string): Promise<{ adjusted: number }> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let adjusted = 0;

      for (const line of lines) {
        const item = await queryRunner.manager.findOne(Item, { where: { idItem: line.idItem } });
        if (!item) throw new NotFoundError(`Article introuvable : ${line.idItem}`);

        const theoretical = Number(item.quantity ?? 0);
        const physical = Number(line.physicalQty);
        const gap = physical - theoretical;

        // No gap — skip this item
        if (gap === 0) continue;

        const isPositive = gap > 0;
        const absGap = Math.abs(gap);

        item.quantity = physical;

        const movement = queryRunner.manager.create(StockMovement, {
          idItem: item.idItem,
          quantity: absGap,
          direction: isPositive ? STOCK_MOVEMENT_DIRECTION.IN : STOCK_MOVEMENT_DIRECTION.OUT,
          reason: `Ajustement inventaire physique — Théorique : ${theoretical}, Physique : ${physical}`,
          movementDate: new Date(),
          movementType: STOCK_MOVEMENT_TYPE.INVENTAIRE,
          idOperator,
          status: STOCK_MOVEMENT_STATUS.VALIDATED,
        });

        await queryRunner.manager.save(Item, item);
        await queryRunner.manager.save(StockMovement, movement);
        adjusted++;
      }

      await queryRunner.commitTransaction();
      return { adjusted };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}

export const stockMovementService = new StockMovementService();


