import AppDataSource from "../../../database/data-source";
import { Item } from "../../../database/Entities/Item";
import { StockMovement } from "../../../database/Entities/StockMovement";
import { NotFoundError } from "../../../shared/errors/AppError";
import { STOCK_MOVEMENT_DIRECTION, STOCK_MOVEMENT_STATUS, STOCK_MOVEMENT_TYPE } from "../../items/constants/stock.constants";

export interface InventoryLineDto {
  idItem: string;
  physicalQty: number;
}

export class InventoryService {
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

export const inventoryService = new InventoryService();
