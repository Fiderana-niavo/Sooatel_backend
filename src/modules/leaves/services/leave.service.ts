import AppDataSource from "../../../database/data-source";
import { Leave } from "../../../database/Entities/Leave";
import { LeaveTransaction } from "../../../database/Entities/LeaveTransaction";
import { EmployeeLeaveBalance } from "../../../database/Entities/EmployeeLeaveBalance";
import { LeaveType } from "../../../database/Entities/LeaveType";
import { Employee } from "../../../database/Entities/Employee";
import { EmployeeJob } from "../../../database/Entities/EmployeeJob";
import { JOB_STATUS, LEAVE_TRANSACTION_TYPE, DEDUCTION_MODE, CAP_PERIOD } from "../../../shared/constants/leave.constants";
import { getHrSettings } from "../../../shared/utils/hr-settings.utils";
import { AppError } from "../../../shared/errors/AppError";
import {
  CreateLeaveDto,
  LEAVE_STATUS,
  LeaveBalanceResponse,
  LeaveResponse,
  LeaveTransactionResponse,
  OverflowCheckResponse,
  OverflowResolutionDto,
  SalaryDeductionDto,
} from "../type/leave.type";

export class LeaveService {
  async createLeave(dto: CreateLeaveDto): Promise<LeaveResponse | OverflowCheckResponse> {
    return AppDataSource.transaction(async (manager) => {
      const { IsNull } = require("typeorm");

      const job = await manager.findOne(EmployeeJob, {
        where: { idEmployee: dto.idEmployee, endDate: IsNull() },
        order: { assignmentDate: "DESC" },
      });
      if (!job) throw new AppError("No active job found for this employee.");
      if (job.status === JOB_STATUS.CANCELLED) throw new AppError("Cannot create a leave for a cancelled employee.");

      const leaveType = await manager.findOne(LeaveType, { where: { idLeaveType: dto.idLeaveType } });
      if (!leaveType) throw new AppError("Leave type not found.");

      const start = new Date(dto.startDate);
      const end = new Date(dto.endDate);
      const leaveDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Cap check (not applicable to OPTIONAL mode which has no cap)
      if (leaveType.cap !== null && leaveType.deductionMode !== DEDUCTION_MODE.OPTIONAL) {
        const capUsed = await this.getCapUsed(manager, dto.idEmployee, dto.idLeaveType, leaveType.capPeriod);
        const remaining = leaveType.cap - capUsed;

        if (leaveDays > remaining) {
          return {
            needsOverflowResolution: true as const,
            capDays: Math.max(remaining, 0),
            overflowDays: leaveDays - Math.max(remaining, 0),
            leaveTypeLabel: leaveType.label,
          };
        }
      }

      return this.persistLeave(manager, dto, leaveDays, job.status, leaveType);
    });
  }

  async resolveOverflow(dto: OverflowResolutionDto): Promise<LeaveResponse[]> {
    return AppDataSource.transaction(async (manager) => {
      const { IsNull } = require("typeorm");

      const job = await manager.findOne(EmployeeJob, {
        where: { idEmployee: dto.idEmployee, endDate: IsNull() },
        order: { assignmentDate: "DESC" },
      });
      if (!job) throw new AppError("No active job found for this employee.");
      if (job.status === JOB_STATUS.CANCELLED) throw new AppError("Cannot create a leave for a cancelled employee.");

      const leaveType = await manager.findOne(LeaveType, { where: { idLeaveType: dto.idLeaveType } });
      if (!leaveType) throw new AppError("Leave type not found.");

      const start = new Date(dto.startDate);
      const capEnd = new Date(start);
      capEnd.setDate(capEnd.getDate() + dto.capDays - 1);
      const overflowStart = new Date(capEnd);
      overflowStart.setDate(overflowStart.getDate() + 1);
      const end = new Date(dto.endDate);

      const results: LeaveResponse[] = [];

      // Leave 1: within cap, original type
      if (dto.capDays > 0) {
        const leave1 = await this.persistLeave(
          manager,
          { ...dto, endDate: capEnd.toISOString().slice(0, 10) },
          dto.capDays,
          job.status,
          leaveType,
        );
        results.push(leave1 as LeaveResponse);
      }

      // Leave 2: overflow, chosen type (annual or unpaid)
      const overflowTypeId = dto.resolution === "ANNUAL" ? dto.idAnnualLeaveType : dto.idUnpaidLeaveType;
      if (!overflowTypeId) throw new AppError("Overflow leave type ID is required.");

      const overflowType = await manager.findOne(LeaveType, { where: { idLeaveType: overflowTypeId } });
      if (!overflowType) throw new AppError("Overflow leave type not found.");

      const leave2 = await this.persistLeave(
        manager,
        { ...dto, idLeaveType: overflowTypeId, startDate: overflowStart.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) },
        dto.overflowDays,
        job.status,
        overflowType,
      );
      results.push(leave2 as LeaveResponse);

      return results;
    });
  }

  async deleteLeave(idLeave: string): Promise<void> {
    return AppDataSource.transaction(async (manager) => {
      const leave = await manager.findOne(Leave, { where: { idLeave } });
      if (!leave) throw new AppError("Leave not found.");

      const transactions = await manager.find(LeaveTransaction, { where: { idLeave } });

      for (const tx of transactions) {
        if (tx.transactionType === LEAVE_TRANSACTION_TYPE.USAGE) {
          await this.updateBalance(manager, tx.idEmployee, tx.idLeaveType, { usedDays: -Number(tx.amount) });
        } else if (tx.transactionType === LEAVE_TRANSACTION_TYPE.ADVANCE) {
          await this.updateBalance(manager, tx.idEmployee, tx.idLeaveType, { advanceDays: -Number(tx.amount) });
        }
      }

      if (transactions.length > 0) {
        await manager.remove(LeaveTransaction, transactions);
      }

      await manager.remove(Leave, leave);
    });
  }

  async allocateMonthlyLeave(idEmployee: string, idLeaveType: string): Promise<void> {
    return AppDataSource.transaction(async (manager) => {
      const employee = await manager.findOne(Employee, { where: { idEmployee } });
      if (!employee) throw new AppError("Employee not found.");

      const job = await manager.findOne(EmployeeJob, {
        where: { idEmployee },
        order: { assignmentDate: "DESC" },
      });

      if (!job || job.status === JOB_STATUS.CANCELLED) return;

      const rate = getHrSettings().DEFAULT_LEAVE_DAYS_PER_MONTH;

      await manager.save(
        LeaveTransaction,
        manager.create(LeaveTransaction, {
          transactionType: LEAVE_TRANSACTION_TYPE.ALLOCATION,
          amount: rate,
          createdAt: new Date(),
          idLeave: null,
          idLeaveType,
          idEmployee,
        }),
      );

      await this.updateBalance(manager, idEmployee, idLeaveType, {
        allocatedDays: rate,
      });
    });
  }

  async confirmJob(idEmployee: string): Promise<void> {
    return AppDataSource.transaction(async (manager) => {
      const job = await manager.findOne(EmployeeJob, {
        where: { idEmployee },
        order: { assignmentDate: "DESC" },
      });

      if (!job) throw new AppError("No job found for this employee.");
      if (job.status !== JOB_STATUS.PENDING) {
        throw new AppError("Only a PENDING employee can be confirmed.");
      }

      await manager.update(EmployeeJob, job.idEmpJob, {
        status: JOB_STATUS.CONFIRMED,
        confirmedDate: new Date(),
      });
    });
  }

  async recordSalaryDeduction(dto: SalaryDeductionDto): Promise<void> {
    return AppDataSource.transaction(async (manager) => {
      await manager.save(
        LeaveTransaction,
        manager.create(LeaveTransaction, {
          transactionType: LEAVE_TRANSACTION_TYPE.SALARY_DEDUCTION,
          amount: dto.amount,
          createdAt: new Date(),
          idLeave: null,
          idLeaveType: dto.idLeaveType,
          idEmployee: dto.idEmployee,
        }),
      );

      await this.updateBalance(manager, dto.idEmployee, dto.idLeaveType, {
        advanceDays: -dto.advanceDays,
      });
    });
  }

  async getBalance(idEmployee: string, idLeaveType: string): Promise<LeaveBalanceResponse | null> {
    const balance = await AppDataSource.getRepository(EmployeeLeaveBalance).findOne({
      where: { idEmployee, idLeaveType },
      relations: { leaveType: true },
    });

    if (!balance) return null;
    return this.toBalanceResponse(balance);
  }

  async getBalances(idEmployee: string): Promise<LeaveBalanceResponse[]> {
    const balances = await AppDataSource.getRepository(EmployeeLeaveBalance).find({
      where: { idEmployee },
      relations: { leaveType: true },
    });

    return balances.map(this.toBalanceResponse.bind(this));
  }

  async getTransactions(idEmployee: string): Promise<LeaveTransactionResponse[]> {
    const records = await AppDataSource.getRepository(LeaveTransaction).find({
      where: { idEmployee },
      relations: { leaveType: true },
      order: { createdAt: "DESC" },
    });

    return records.map(this.toTransactionResponse.bind(this));
  }

  async getLeaveTypes(): Promise<LeaveType[]> {
    return AppDataSource.getRepository(LeaveType).find({ order: { label: "ASC" } });
  }

  async createLeaveType(dto: { label: string; isPaid: boolean; requiresProof: boolean; deductionMode: string; cap?: number | null; capPeriod?: string | null }): Promise<LeaveType> {
    const repo = AppDataSource.getRepository(LeaveType);
    const entity = repo.create({
      label: dto.label,
      isPaid: dto.isPaid,
      requiresProof: dto.requiresProof,
      deductionMode: dto.deductionMode as LeaveType["deductionMode"],
      cap: dto.deductionMode === DEDUCTION_MODE.OPTIONAL ? null : (dto.cap ?? null),
      capPeriod: dto.cap ? dto.capPeriod as LeaveType["capPeriod"] : null,
    });
    return repo.save(entity);
  }

  async updateLeaveType(idLeaveType: string, dto: { label?: string; isPaid?: boolean; requiresProof?: boolean; deductionMode?: string; cap?: number | null; capPeriod?: string | null }): Promise<LeaveType> {
    const repo = AppDataSource.getRepository(LeaveType);
    const entity = await repo.findOne({ where: { idLeaveType } });
    if (!entity) throw new AppError("Leave type not found.");

    if (dto.label !== undefined) entity.label = dto.label;
    if (dto.isPaid !== undefined) entity.isPaid = dto.isPaid;
    if (dto.requiresProof !== undefined) entity.requiresProof = dto.requiresProof;
    if (dto.deductionMode !== undefined) {
      entity.deductionMode = dto.deductionMode as LeaveType["deductionMode"];
      // OPTIONAL cannot have a cap
      if (dto.deductionMode === DEDUCTION_MODE.OPTIONAL) {
        entity.cap = null;
        entity.capPeriod = null;
      }
    }
    if (entity.deductionMode !== DEDUCTION_MODE.OPTIONAL) {
      if (dto.cap !== undefined) entity.cap = dto.cap ?? null;
      if (dto.capPeriod !== undefined) entity.capPeriod = dto.cap ? dto.capPeriod as LeaveType["capPeriod"] : null;
    }

    return repo.save(entity);
  }

  async deleteLeaveType(idLeaveType: string): Promise<void> {
    const repo = AppDataSource.getRepository(LeaveType);
    const entity = await repo.findOne({ where: { idLeaveType } });
    if (!entity) throw new AppError("Leave type not found.");
    await repo.remove(entity);
  }

  private async persistLeave(
    manager: typeof AppDataSource.manager,
    dto: { idEmployee: string; idLeaveType: string; startDate: string; endDate: string; leaveUnit?: string; deductFromAnnual?: boolean },
    leaveDays: number,
    jobStatus: number,
    leaveType: LeaveType,
  ): Promise<LeaveResponse> {
    const isPending = jobStatus === JOB_STATUS.PENDING;
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    const leave = await manager.save(
      Leave,
      manager.create(Leave, {
        startDate: start,
        endDate: end,
        leaveUnit: dto.leaveUnit ?? "day",
        idEmployee: dto.idEmployee,
        idLeaveType: dto.idLeaveType,
        status: LEAVE_STATUS.PENDING,
      }),
    );

    if (isPending) {
      // Pending employee: record as advance
      await manager.save(LeaveTransaction, manager.create(LeaveTransaction, {
        transactionType: LEAVE_TRANSACTION_TYPE.ADVANCE,
        amount: leaveDays,
        createdAt: new Date(),
        idLeave: leave.idLeave,
        idLeaveType: dto.idLeaveType,
        idEmployee: dto.idEmployee,
      }));
      await this.updateBalance(manager, dto.idEmployee, dto.idLeaveType, { advanceDays: leaveDays });
    } else if (leaveType.deductionMode === DEDUCTION_MODE.ALWAYS || dto.deductFromAnnual === true) {
      // Deduct from annual balance (negative balance allowed)
      await manager.save(LeaveTransaction, manager.create(LeaveTransaction, {
        transactionType: LEAVE_TRANSACTION_TYPE.USAGE,
        amount: leaveDays,
        createdAt: new Date(),
        idLeave: leave.idLeave,
        idLeaveType: dto.idLeaveType,
        idEmployee: dto.idEmployee,
      }));
      await this.updateBalance(manager, dto.idEmployee, dto.idLeaveType, { usedDays: leaveDays });
    } else {
      // NEVER or OPTIONAL (not deducted from annual): use own balance
      await manager.save(LeaveTransaction, manager.create(LeaveTransaction, {
        transactionType: LEAVE_TRANSACTION_TYPE.USAGE,
        amount: leaveDays,
        createdAt: new Date(),
        idLeave: leave.idLeave,
        idLeaveType: dto.idLeaveType,
        idEmployee: dto.idEmployee,
      }));
      await this.updateBalance(manager, dto.idEmployee, dto.idLeaveType, { usedDays: leaveDays });
    }

    return this.toLeaveResponse(leave, isPending);
  }

  private async getCapUsed(
    manager: typeof AppDataSource.manager,
    idEmployee: string,
    idLeaveType: string,
    capPeriod: string | null,
  ): Promise<number> {
    const qb = manager
      .getRepository(Leave)
      .createQueryBuilder("l")
      .where("l.id_employee = :idEmployee", { idEmployee })
      .andWhere("l.id_leave_type = :idLeaveType", { idLeaveType })
      .andWhere("l.status != :cancelled", { cancelled: LEAVE_STATUS.CANCELLED });

    if (capPeriod === CAP_PERIOD.ANNUAL) {
      const year = new Date().getFullYear();
      qb.andWhere("YEAR(l.start_date) = :year", { year });
    }

    const leaves = await qb.getMany();
    return leaves.reduce((sum, l) => {
      const days = Math.ceil((l.endDate.getTime() - l.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return sum + days;
    }, 0);
  }

  private async updateBalance(
    manager: typeof AppDataSource.manager,
    idEmployee: string,
    idLeaveType: string,
    delta: { allocatedDays?: number; usedDays?: number; advanceDays?: number },
  ): Promise<void> {
    const balanceRepo = manager.getRepository(EmployeeLeaveBalance);
    let balance = await balanceRepo.findOne({ where: { idEmployee, idLeaveType } });

    if (!balance) {
      balance = balanceRepo.create({
        idEmployee,
        idLeaveType,
        allocatedDays: 0,
        usedDays: 0,
        advanceDays: 0,
      });
    }

    balance.allocatedDays = Number(balance.allocatedDays) + (delta.allocatedDays ?? 0);
    balance.usedDays = Number(balance.usedDays) + (delta.usedDays ?? 0);
    balance.advanceDays = Number(balance.advanceDays) + (delta.advanceDays ?? 0);

    await balanceRepo.save(balance);
  }

  private toLeaveResponse(leave: Leave, isAdvance: boolean): LeaveResponse {
    return {
      idLeave: leave.idLeave,
      ref: leave.ref,
      startDate: leave.startDate.toISOString(),
      endDate: leave.endDate.toISOString(),
      leaveUnit: leave.leaveUnit,
      status: leave.status,
      statusLabel: this.resolveLeaveStatusLabel(leave.status),
      idEmployee: leave.idEmployee,
      employeeName: null,
      idLeaveType: leave.idLeaveType,
      leaveTypeLabel: null,
      isAdvance,
    };
  }

  private toBalanceResponse(balance: EmployeeLeaveBalance): LeaveBalanceResponse {
    return {
      idEmployeeLeaveBalance: balance.idEmployeeLeaveBalance,
      idEmployee: balance.idEmployee,
      idLeaveType: balance.idLeaveType,
      leaveTypeLabel: balance.leaveType?.label ?? null,
      allocatedDays: Number(balance.allocatedDays),
      usedDays: Number(balance.usedDays),
      advanceDays: Number(balance.advanceDays),
      availableDays: Number(balance.allocatedDays) - Number(balance.usedDays),
    };
  }

  private toTransactionResponse(tx: LeaveTransaction): LeaveTransactionResponse {
    return {
      idTransaction: tx.idTransaction,
      transactionType: tx.transactionType,
      amount: Number(tx.amount),
      createdAt: tx.createdAt?.toISOString() ?? "",
      idLeave: tx.idLeave,
      idLeaveType: tx.idLeaveType,
      leaveTypeLabel: tx.leaveType?.label ?? null,
      idEmployee: tx.idEmployee,
    };
  }

  async getUpcomingLeaves(): Promise<LeaveResponse[]> {
    const { MoreThanOrEqual, Not, In } = require("typeorm");
    
    // Start of today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const leaves = await AppDataSource.getRepository(Leave).find({
      where: { startDate: MoreThanOrEqual(today), status: Not(In([-1, -3])) },
      relations: {
        employee: true,
        leaveType: true,
      },
      order: {
        startDate: "ASC",
      },
    });

    return leaves.map((l) => ({
      ...this.toLeaveResponse(l, false), // isAdvance is not easily known here without checking transactions, but it's not crucial for the list
      employeeName: l.employee ? `${l.employee.name} ${l.employee.lastname}` : null,
      leaveTypeLabel: l.leaveType ? l.leaveType.label : null,
    }));
  }

  private resolveLeaveStatusLabel(status: number): string {
    const map: Record<number, string> = {
      5: "En attente",
      0: "Approuvé",
      [-1]: "Rejeté",
      [-3]: "Annulé",
    };
    return map[status] ?? "Inconnu";
  }
}
