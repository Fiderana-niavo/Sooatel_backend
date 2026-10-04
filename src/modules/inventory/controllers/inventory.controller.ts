import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../../../shared/types/ApiResponse";
import { inventoryService } from "../services/inventory.service";

export class InventoryController {
  submitInventory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body;
      const lines = Array.isArray(body) ? body : body.lines;
      const inventoryDate = !Array.isArray(body) ? body.inventoryDate : undefined;

      const idOperator = (req as Request & { idEmployee?: string }).idEmployee;
      if (!idOperator) {
        res
          .status(400)
          .json(ApiResponse.error("Votre compte n'est pas lié à un employé. Action impossible."));
        return;
      }
      if (!Array.isArray(lines)) {
        res.status(400).json(ApiResponse.error("Le tableau des lignes d'inventaire est invalide."));
        return;
      }
      const result = await inventoryService.submitInventory(lines, idOperator, inventoryDate);
      res.status(201).json(ApiResponse.success(result));
    } catch (err) {
      next(err);
    }
  };
}

export const inventoryController = new InventoryController();
