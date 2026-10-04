import { QueryRunner } from "typeorm";
import { Item } from "../../../database/Entities/Item";
import { MenuItem } from "../../../database/Entities/MenuItem";
import { Recipe } from "../../../database/Entities/Recipe";
import { RecipeDetail } from "../../../database/Entities/RecipeDetail";
import { SaleItem } from "../../../database/Entities/SaleItem";
import { StockMovement } from "../../../database/Entities/StockMovement";
import {
  STOCK_MOVEMENT_DIRECTION,
  STOCK_MOVEMENT_STATUS,
  STOCK_MOVEMENT_TYPE,
} from "../../items/constants/stock.constants";

interface IngredientAdjustment {
  item: Item;
  qty: number;
}

const buildIngredientAdjustments = async (
  queryRunner: QueryRunner,
  saleItems: SaleItem[],
): Promise<IngredientAdjustment[]> => {
  const adjustments = new Map<string, IngredientAdjustment>();

  for (const saleItem of saleItems) {
    const menuItem = await queryRunner.manager.findOne(MenuItem, {
      where: { idMenu: saleItem.idMenu },
    });
    if (!menuItem) continue;

    const recipe = await queryRunner.manager.findOne(Recipe, {
      where: { idItem: menuItem.idItem, isActive: true },
    });
    if (!recipe) continue;

    const recipeDetails = await queryRunner.manager.find(RecipeDetail, {
      where: { idRecipe: recipe.idRecipe },
      relations: { ingredient: true },
    });

    const ratio = Number(saleItem.quantity) / Number(recipe.yieldQuantity);

    for (const detail of recipeDetails) {
      const required = Number(detail.quantity) * ratio;
      const existing = adjustments.get(detail.ingredient.idItem);
      if (existing) {
        existing.qty += required;
      } else {
        adjustments.set(detail.ingredient.idItem, {
          item: detail.ingredient,
          qty: required,
        });
      }
    }
  }

  return Array.from(adjustments.values());
};

export const deductStockForSale = async (
  queryRunner: QueryRunner,
  saleItems: SaleItem[],
  invoiceNumber: string | null,
  idOperator: string,
): Promise<void> => {
  const adjustments = await buildIngredientAdjustments(queryRunner, saleItems);
  if (adjustments.length === 0) return;

  const movements: StockMovement[] = [];
  const itemsToUpdate: Item[] = [];

  for (const adj of adjustments) {
    const ingredient = await queryRunner.manager.findOne(Item, {
      where: { idItem: adj.item.idItem },
    });
    if (!ingredient) continue;

    ingredient.quantity = Number(ingredient.quantity) - adj.qty;
    itemsToUpdate.push(ingredient);

    const mvt = queryRunner.manager.create(StockMovement, {
      idItem: ingredient.idItem,
      movementDate: new Date(),
      quantity: adj.qty,
      movementType: STOCK_MOVEMENT_TYPE.MANUEL,
      direction: STOCK_MOVEMENT_DIRECTION.OUT,
      reason: `Sale closure - Invoice ${invoiceNumber || "N/A"}`,
      status: STOCK_MOVEMENT_STATUS.VALIDATED,
      idOperator,
    });
    movements.push(mvt);
  }

  await queryRunner.manager.save(Item, itemsToUpdate);
  await queryRunner.manager.save(StockMovement, movements);
};

export const restoreStockForSale = async (
  queryRunner: QueryRunner,
  saleItems: SaleItem[],
  invoiceNumber: string | null,
  idOperator: string,
): Promise<void> => {
  const adjustments = await buildIngredientAdjustments(queryRunner, saleItems);
  if (adjustments.length === 0) return;

  const movements: StockMovement[] = [];
  const itemsToUpdate: Item[] = [];

  for (const adj of adjustments) {
    const ingredient = await queryRunner.manager.findOne(Item, {
      where: { idItem: adj.item.idItem },
    });
    if (!ingredient) continue;

    ingredient.quantity = Number(ingredient.quantity) + adj.qty;
    itemsToUpdate.push(ingredient);

    const mvt = queryRunner.manager.create(StockMovement, {
      idItem: ingredient.idItem,
      movementDate: new Date(),
      quantity: adj.qty,
      movementType: STOCK_MOVEMENT_TYPE.MANUEL,
      direction: STOCK_MOVEMENT_DIRECTION.IN,
      reason: `Sale reopen reversal - Invoice ${invoiceNumber || "N/A"}`,
      status: STOCK_MOVEMENT_STATUS.VALIDATED,
      idOperator,
    });
    movements.push(mvt);
  }

  await queryRunner.manager.save(Item, itemsToUpdate);
  await queryRunner.manager.save(StockMovement, movements);
};
