import { Between, IsNull, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import AppDataSource from "../../../database/data-source";
import { Schedule } from "../../../database/Entities/Schedule";
import { EmployeeTeam } from "../../../database/Entities/EmployeeTeam";
import { EmployeeJob } from "../../../database/Entities/EmployeeJob";
import { ShiftType } from "../../../database/Entities/ShiftType";
import { Leave } from "../../../database/Entities/Leave";
import {
  ScheduleDto,
  SaveSchedulesPayload,
  ScheduleResponse,
  GenerateByTeamDto,
  GeneratedScheduleRow,
  AvailableEmployee,
  ScheduleRangeSearchOptions,
  AvailableEmployeesOptions,
  CheckExistingResult,
} from "../type/schedule.type";

export class ScheduleService {
  // ─── Helpers ─────────────────────────────────────────────────────────────

  private toDateString(date: Date | string): string {
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().slice(0, 10);
  }

  private buildDays(startDate: string, endDate: string): Date[] {
    const days: Date[] = [];
    const cursor = new Date(startDate + "T00:00:00Z");
    const end = new Date(endDate + "T00:00:00Z");
    while (cursor <= end) {
      days.push(new Date(cursor));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return days;
  }

  private toResponse(schedule: Schedule): ScheduleResponse {
    // Get the first active job from the loaded relation (if loaded)
    const empJobs = (schedule.employee as any)?.employeeJobs;
    const activeJob = empJobs?.[0];
    return {
      idSchedule: schedule.idSchedule,
      scheduleDate: this.toDateString(schedule.scheduleDate as unknown as Date),
      idEmployee: schedule.idEmployee,
      employeeName: schedule.employee
        ? `${schedule.employee.name ?? ""} ${schedule.employee.lastname ?? ""}`.trim()
        : null,
      idJobTitle: activeJob?.idJobTitle ?? null,
      jobTitle: activeJob?.jobTitle?.title ?? null,
      idShiftType: schedule.idShiftType ?? null,
      shiftLabel: schedule.shiftType?.label ?? null,
      customStartTime: schedule.customStartTime ?? null,
      customEndTime: schedule.customEndTime ?? null,
    };
  }

  // ─── Compute rotation duration from a ShiftType ───────────────────────────

  private computeRotationDurationMs(shift: ShiftType): number {
    const parseTime = (t: string): number => {
      const parts = t.split(":").map(Number);
      const h = parts[0] ?? 0;
      const m = parts[1] ?? 0;
      return (h * 60 + m) * 60 * 1000;
    };
    const start = parseTime(shift.customStartTime ?? "00:00");
    let end = parseTime(shift.customEndTime ?? "24:00");
    // Handle overnight shifts (end < start means next day)
    if (end <= start) end += 24 * 60 * 60 * 1000;
    return end - start;
  }

  // ─── Check existing schedules in range ───────────────────────────────────

  async checkExisting(startDate: string, endDate: string): Promise<CheckExistingResult> {
    const repo = AppDataSource.getRepository(Schedule);
    const start = new Date(startDate + "T00:00:00Z");
    const end = new Date(endDate + "T23:59:59Z");

    const records = await repo.find({
      where: { scheduleDate: Between(start, end) as unknown as Date },
      select: { scheduleDate: true },
    });

    const dateStrings = [
      ...new Set(records.map((r) => this.toDateString(r.scheduleDate as unknown as Date))),
    ].sort();

    return {
      hasExisting: records.length > 0,
      count: records.length,
      dates: dateStrings,
    };
  }

  // ─── Find schedules by range ──────────────────────────────────────────────

  async findByRange(options: ScheduleRangeSearchOptions): Promise<ScheduleResponse[]> {
    const startDate = options.startDate ?? this.toDateString(new Date());
    const endDate = options.endDate ?? startDate;

    const records = await AppDataSource.getRepository(Schedule)
      .createQueryBuilder("s")
      .leftJoinAndSelect("s.employee", "emp")
      .leftJoinAndSelect("s.shiftType", "st")
      .leftJoinAndSelect("emp.employeeJobs", "ej", "ej.end_date IS NULL")
      .leftJoinAndSelect("ej.jobTitle", "jt")
      .where("s.schedule_date BETWEEN :start AND :end", { start: startDate, end: endDate })
      .orderBy("s.schedule_date", "ASC")
      .getMany();

    return records.map((s) => this.toResponse(s));
  }

  // ─── Save schedules (bulk, with optional overwrite) ───────────────────────

  async saveSchedules(payload: SaveSchedulesPayload): Promise<ScheduleResponse[]> {
    const repo = AppDataSource.getRepository(Schedule);

    if (payload.overwrite) {
      const start = new Date(payload.startDate + "T00:00:00Z");
      const end = new Date(payload.endDate + "T23:59:59Z");
      await repo.delete({
        scheduleDate: Between(start, end) as unknown as Date,
      });
    }

    const entities = payload.rows.map((dto) => {
      const entity = repo.create();
      entity.idEmployee = dto.idEmployee;
      entity.scheduleDate = new Date(dto.scheduleDate) as unknown as Date;
      entity.idShiftType = (dto.idShiftType ?? null) as unknown as string;
      entity.customStartTime = (dto.customStartTime ?? null) as unknown as string;
      entity.customEndTime = (dto.customEndTime ?? null) as unknown as string;
      return entity;
    });

    const saved = await repo.save(entities);

    const withRelations = await repo.find({
      where: saved.map((s) => ({ idSchedule: s.idSchedule })),
      relations: { employee: true, shiftType: true },
    });

    return withRelations.map((s) => this.toResponse(s));
  }

  // ─── Generate by team rotation ────────────────────────────────────────────

  async generateByTeam(dto: GenerateByTeamDto): Promise<GeneratedScheduleRow[]> {
    // Load the rotation shift to compute duration
    const rotationShift = await AppDataSource.getRepository(ShiftType).findOne({
      where: { idShiftType: dto.idRotationShift },
    });

    const rotationDurationMs = rotationShift
      ? this.computeRotationDurationMs(rotationShift)
      : 24 * 60 * 60 * 1000; // fallback: 24h

    const days = this.buildDays(dto.startDate, dto.endDate);
    const totalDurationMs = days.length * 24 * 60 * 60 * 1000;

    // Build leave map for the entire range
    const onLeaveMap = await this.buildOnLeaveMap(
      new Date(dto.startDate + "T00:00:00Z"),
      new Date(dto.endDate + "T23:59:59Z"),
    );

    const rows: GeneratedScheduleRow[] = [];

    // Number of rotation slots over the total period
    const rotationSlots = Math.ceil(totalDurationMs / rotationDurationMs);

    for (let slot = 0; slot < rotationSlots; slot++) {
      // Pick the team whose turn it is for this slot
      const idTeam = dto.teamIds[slot % dto.teamIds.length];
      const idShiftType = dto.shiftIds[0];

      if (!idTeam || !idShiftType) continue;

      const shift = await AppDataSource.getRepository(ShiftType).findOne({
        where: { idShiftType },
      });

      const members = await this.fetchTeamMembers(idTeam);



      // Compute which days fall into this rotation slot
      const slotStartMs = slot * rotationDurationMs;
      const slotEndMs = (slot + 1) * rotationDurationMs;
      const periodStartMs = new Date(dto.startDate + "T00:00:00Z").getTime();

      const slotDays = days.filter((d) => {
        const offset = d.getTime() - periodStartMs;
        return offset >= slotStartMs && offset < slotEndMs;
      });

      for (const member of members) {
        for (const day of slotDays) {
          const dateStr = this.toDateString(day);
          const isOnLeave = onLeaveMap.get(member.idEmployee)?.has(dateStr) ?? false;

          rows.push({
            idEmployee: member.idEmployee,
            employeeName: member.employeeName,
            idJobTitle: member.idJobTitle,
            jobTitle: member.jobTitle,
            scheduleDate: dateStr,
            idShiftType: shift?.idShiftType ?? null,
            shiftLabel: shift?.label ?? null,
            customStartTime: shift?.customStartTime ?? null,
            customEndTime: shift?.customEndTime ?? null,
            isOnLeave,
          });
        }
      }
    }

    return rows;

  }

  // ─── Get available employees ──────────────────────────────────────────────

  async getAvailableEmployees(options: AvailableEmployeesOptions): Promise<AvailableEmployee[]> {
    const date = options.date ? new Date(options.date) : new Date();
    const dayOfWeek = date.getUTCDay();

    const qb = AppDataSource.getRepository(EmployeeJob)
      .createQueryBuilder("ej")
      .leftJoinAndSelect("ej.employee", "emp")
      .leftJoinAndSelect("ej.jobTitle", "jt")
      .leftJoinAndSelect("ej.availabilities", "avail")
      .leftJoinAndSelect("avail.shiftType", "st")
      .where("ej.end_date IS NULL");

    if (options.idJobTitle) {
      qb.andWhere("ej.id_job_title = :idJobTitle", { idJobTitle: options.idJobTitle });
    }

    const jobs = await qb.getMany();

    return jobs
      .filter((job) => job.employee)
      .map((job) => ({
        idEmployee: job.idEmployee,
        employeeName: job.employee
          ? `${job.employee.name ?? ""} ${job.employee.lastname ?? ""}`.trim()
          : null,
        idJobTitle: job.idJobTitle ?? null,
        jobTitle: job.jobTitle?.title ?? null,
        availabilities: (job.availabilities ?? [])
          .filter((a) => a.dayOfWeek === dayOfWeek || a.dayOfWeek === null)
          .map((a) => ({
            dayOfWeek: a.dayOfWeek,
            idShiftType: a.idShiftType ?? null,
            shiftLabel: a.shiftType?.label ?? null,
            customStartTime: a.customStartTime ?? null,
            customEndTime: a.customEndTime ?? null,
          })),
      }));
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async buildOnLeaveMap(
    start: Date,
    end: Date,
  ): Promise<Map<string, Set<string>>> {
    const approvedLeaves = await AppDataSource.getRepository(Leave).find({
      where: { status: 0 }, // 0 = APPROVED
    });

    const map = new Map<string, Set<string>>();

    for (const leave of approvedLeaves) {
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);

      if (leaveEnd < start || leaveStart > end) continue;

      const cursor = new Date(Math.max(leaveStart.getTime(), start.getTime()));
      const finish = new Date(Math.min(leaveEnd.getTime(), end.getTime()));

      while (cursor <= finish) {
        const dateStr = this.toDateString(cursor);
        if (!map.has(leave.idEmployee)) map.set(leave.idEmployee, new Set());
        map.get(leave.idEmployee)!.add(dateStr);
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    }

    return map;
  }

  private async fetchTeamMembers(idTeam: string): Promise<
    Array<{ idEmployee: string; employeeName: string | null; idJobTitle: string | null; jobTitle: string | null }>
  > {
    const memberLinks = await AppDataSource.getRepository(EmployeeTeam).find({
      where: { idTeam },
      relations: { employee: true },
    });

    const result = [];
    for (const link of memberLinks) {
      const activeJob = await AppDataSource.getRepository(EmployeeJob).findOne({
        where: { idEmployee: link.idEmployee, endDate: IsNull() },
        relations: { jobTitle: true },
        order: { assignmentDate: "DESC" },
      });

      result.push({
        idEmployee: link.idEmployee,
        employeeName: link.employee
          ? `${link.employee.name ?? ""} ${link.employee.lastname ?? ""}`.trim()
          : null,
        idJobTitle: activeJob?.idJobTitle ?? null,
        jobTitle: activeJob?.jobTitle?.title ?? null,
      });
    }
    return result;
  }
}
