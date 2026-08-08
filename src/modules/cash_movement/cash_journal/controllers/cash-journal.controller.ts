import { Request, Response, NextFunction } from "express";
import { CrudController } from "../../../../shared/crud/controllers/CrudController";
import { CashJournal } from "../../../../database/Entities/CashJournal";
import { CashJournalDto } from "../type/cash-journal.type";
import { CashJournalService } from "../services/cash-journal.service";
import { ApiResponse } from "../../../../shared/types/ApiResponse";

class CashJournalController extends CrudController<CashJournal, CashJournalDto, CashJournalDto> {
  private journalService: CashJournalService;

  constructor() {
    const service = new CashJournalService();
    super(service);
    this.journalService = service;
  }

  openJournal = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let idCashier = (req as any).idEmployee;
      
      if (!idCashier) {
        const idUser = (req as any).userId;
        if (idUser) {
          const userRepo = require("../../../../database/data-source").default.getRepository(require("../../../../database/Entities/User").User);
          const user = await userRepo.findOne({ where: { idUser } });
          if (user) {
            idCashier = user.idEmployee;
          }
        }
      }

      if (!idCashier) {
        res.status(401).json(ApiResponse.error("Utilisateur non identifié. Impossible de lier un employé."));
        return;
      }
      let ref = req.body.ref as string;
      if (!ref || ref === "AUTO") {
        const today = new Date();
        const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
        ref = `JNL-${dateStr}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      }
      const journal = await this.journalService.openJournal({ ref, idCashier });
      res.status(201).json(ApiResponse.success(journal));
    } catch (error: any) {
      res.status(400).json(ApiResponse.error(error.message));
    }
  };

  closeJournal = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params["id"] as string;
      const actualClosingBalance = Number(req.body.actualClosingBalance);
      if (isNaN(actualClosingBalance)) {
        res.status(400).json(ApiResponse.error("Le solde réel de clôture est requis."));
        return;
      }
      const journal = await this.journalService.closeJournal(id, { actualClosingBalance });
      res.json(ApiResponse.success(journal));
    } catch (error: any) {
      res.status(400).json(ApiResponse.error(error.message));
    }
  };

  getMovements = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params["id"] as string;
      const page = req.query["page"] ? parseInt(req.query["page"] as string, 10) : 1;
      const limit = req.query["limit"] ? parseInt(req.query["limit"] as string, 10) : 5;
      const movements = await this.journalService.getJournalMovements(id, page, limit);
      res.json(ApiResponse.success(movements));
    } catch (error: any) {
      next(error);
    }
  };
}

export const cashJournalController = new CashJournalController();
