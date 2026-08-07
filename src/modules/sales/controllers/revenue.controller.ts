import { Request, Response } from "express";
import { RevenueService } from "../services/revenue.service";
import { ApiResponse } from "../../../shared/types/ApiResponse";
import AppDataSource from "../../../database/data-source";
import { User } from "../../../database/Entities/User";

export class RevenueController {
  private revenueService: RevenueService;

  constructor() {
    this.revenueService = new RevenueService();
  }

  async getRevenue(req: Request, res: Response): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const date = req.query.date as string | undefined;
      const idMenu = req.query.idMenu as string | undefined;
      const idSupplier = req.query.idSupplier as string | undefined;

      const result = await this.revenueService.getRevenue({
        page,
        limit,
        date,
        idMenu,
        idSupplier
      });

      res.json(ApiResponse.success(result));
    } catch (error: any) {
      console.error(error);
      res.status(500).json(ApiResponse.error(error.message || "Erreur lors de la récupération de la recette"));
    }
  }

  async journalizeSales(req: Request, res: Response): Promise<void> {
    try {
      // Use the explicitly provided idProcessedBy from body, or resolve from current user
      let idProcessedBy: string = req.body?.idProcessedBy as string;

      if (!idProcessedBy) {
        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOne({
          where: { idUser: req.userId },
          select: { idEmployee: true }
        });

        if (!user?.idEmployee) {
          res.status(401).json(ApiResponse.error("Employé lié à l'utilisateur introuvable."));
          return;
        }

        idProcessedBy = user.idEmployee;
      }

      const result = await this.revenueService.journalizeSales(idProcessedBy);
      res.json(ApiResponse.success(result));
    } catch (error: any) {
      console.error(error);
      res.status(500).json(ApiResponse.error(error.message || "Erreur lors de la journalisation des ventes"));
    }
  }
}
