import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../../shared/types/ApiResponse";
import { ScheduleService } from "../services/schedule.service";

const service = new ScheduleService();

export const scheduleController = {
  // GET /api/schedules?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
  findByRange: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const records = await service.findByRange({
        startDate: req.query["startDate"] as string | undefined,
        endDate: req.query["endDate"] as string | undefined,
      });
      res.json(ApiResponse.success(records));
    } catch (err) {
      next(err);
    }
  },

  // GET /api/schedules/check-existing?startDate=...&endDate=...
  checkExisting: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const startDate = req.query["startDate"] as string;
      const endDate = req.query["endDate"] as string;
      const result = await service.checkExisting(startDate, endDate);
      res.json(ApiResponse.success(result));
    } catch (err) {
      next(err);
    }
  },

  // POST /api/schedules/generate/by-team
  generateByTeam: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rows = await service.generateByTeam(req.body);
      res.json(ApiResponse.success(rows));
    } catch (err) {
      next(err);
    }
  },

  // POST /api/schedules
  saveSchedules: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const saved = await service.saveSchedules(req.body);
      res.status(201).json(ApiResponse.success(saved));
    } catch (err) {
      next(err);
    }
  },

  // GET /api/schedules/available-employees?date=YYYY-MM-DD&idJobTitle=...
  getAvailableEmployees: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employees = await service.getAvailableEmployees({
        date: req.query["date"] as string | undefined,
        idJobTitle: req.query["idJobTitle"] as string | undefined,
      });
      res.json(ApiResponse.success(employees));
    } catch (err) {
      next(err);
    }
  },
};
