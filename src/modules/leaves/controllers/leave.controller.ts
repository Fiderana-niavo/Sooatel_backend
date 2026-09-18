import { NextFunction, Request, Response } from "express";
import { LeaveService } from "../services/leave.service";
import { ApiResponse } from "../../../shared/types/ApiResponse";

export class LeaveController {
  constructor(private service: LeaveService) {}

  getUpcomingLeaves = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.getUpcomingLeaves();
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  };

  createLeave = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.createLeave(req.body);
      // May return OverflowCheckResponse (202) or LeaveResponse (201)
      const status = result && typeof result === "object" && "needsOverflowResolution" in result ? 202 : 201;
      res.status(status).json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  };

  resolveOverflow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.resolveOverflow(req.body);
      res.status(201).json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  };

  allocateMonthly = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { idEmployee, idLeaveType } = req.body;
      await this.service.allocateMonthlyLeave(idEmployee, idLeaveType);
      res.json(ApiResponse.success({ message: "Acquisition enregistrée." }));
    } catch (error) {
      next(error);
    }
  };

  confirmJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idEmployee = req.params["idEmployee"] as string;
      await this.service.confirmJob(idEmployee);
      res.json(ApiResponse.success({ message: "Employé confirmé." }));
    } catch (error) {
      next(error);
    }
  };

  salaryDeduction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.recordSalaryDeduction(req.body);
      res.json(ApiResponse.success({ message: "Déduction enregistrée." }));
    } catch (error) {
      next(error);
    }
  };

  getBalance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idEmployee = req.params["idEmployee"] as string;
      const idLeaveType = req.params["idLeaveType"] as string;
      const result = await this.service.getBalance(idEmployee, idLeaveType);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  };

  getBalances = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idEmployee = req.params["idEmployee"] as string;
      const result = await this.service.getBalances(idEmployee);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  };

  getTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idEmployee = req.params["idEmployee"] as string;
      const result = await this.service.getTransactions(idEmployee);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  };

  getLeaveTypes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.getLeaveTypes();
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  };

  deleteLeave = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idLeave = req.params["id"] as string;
      await this.service.deleteLeave(idLeave);
      res.json(ApiResponse.success({ message: "Congé supprimé avec succès." }));
    } catch (error) {
      next(error);
    }
  };

  createLeaveType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.createLeaveType(req.body);
      res.status(201).json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  };

  updateLeaveType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idLeaveType = req.params["id"] as string;
      const result = await this.service.updateLeaveType(idLeaveType, req.body);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  };

  deleteLeaveType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idLeaveType = req.params["id"] as string;
      await this.service.deleteLeaveType(idLeaveType);
      res.json(ApiResponse.success({ message: "Type de congé supprimé." }));
    } catch (error) {
      next(error);
    }
  };
}

export const leaveController = new LeaveController(new LeaveService());
