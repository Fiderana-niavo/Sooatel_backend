import { Repository } from "typeorm";
import AppDataSource from "../../../database/data-source";
import { Team } from "../../../database/Entities/Team";
import { EmployeeTeam } from "../../../database/Entities/EmployeeTeam";
import { Employee } from "../../../database/Entities/Employee";

import { CrudService } from "../../../shared/crud/services/CrudService";
import { Paginated } from "../../../shared/types/Paginated";
import { TeamDto, TeamSearchOptions } from "../type/team.type";

export class TeamService extends CrudService<Team, TeamDto, TeamDto> {
  constructor(repository: Repository<Team> = AppDataSource.getRepository(Team)) {
    super(repository);
  }

  async findAll(options: TeamSearchOptions = {}): Promise<Paginated<Team>> {
    const pageNum = options.page ?? 1;
    const limitNum = options.limit ?? 10;
    const search = options.search ?? "";

    const qb = this.repository
      .createQueryBuilder("team")
      .skip((pageNum - 1) * limitNum)
      .take(limitNum);

    if (search) {
      qb.andWhere("team.team_name ILIKE :s", { s: `%${search}%` });
    }

    const [records, total] = await qb.getManyAndCount();
    return new Paginated<Team>(records, total, pageNum, limitNum);
  }

  async findOne(id: string): Promise<Team | null> {
    return this.repository.findOne({
      where: { idTeam: id },
    });
  }

  async create(dto: TeamDto): Promise<Team> {
    const existing = await this.repository.findOne({
      where: { teamName: dto.teamName },
    });
    if (existing) {
      throw new Error("Une équipe avec ce nom existe déjà.");
    }
    const team = this.repository.create({
      teamName: dto.teamName,
      description: dto.description,
    });
    return this.repository.save(team);
  }

  async update(id: string, dto: TeamDto): Promise<void> {
    const existing = await this.repository.findOne({
      where: { teamName: dto.teamName },
    });
    if (existing && existing.idTeam !== id) {
      throw new Error("Une équipe avec ce nom existe déjà.");
    }
    await this.repository.update(id, {
      teamName: dto.teamName,
      description: dto.description,
    });
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  // ─── Team Members Management ──────────────────────────────────────────────

  async getMembers(idTeam: string) {
    const qb = AppDataSource.getRepository(EmployeeTeam).createQueryBuilder("et")
      .innerJoinAndSelect("et.employee", "emp")
      .leftJoinAndSelect("emp.employeeJobs", "ej")
      .leftJoinAndSelect("ej.jobTitle", "jt")
      .where("et.id_team = :idTeam", { idTeam });
      
    const employeeTeams = await qb.getMany();
    
    // Map to a cleaner structure
    return employeeTeams.map((et: any) => {
      const activeJob = et.employee.employeeJobs?.[0]; // Assuming ordered or just take first
      return {
        idEmployee: et.employee.idEmployee,
        name: et.employee.name,
        lastname: et.employee.lastname,
        employeeCode: et.employee.employeeCode,
        jobTitle: activeJob?.jobTitle?.title ?? null,
      };
    });
  }

  async getAvailableEmployees() {
    // Get all active employees who are NOT in ANY team
    // activeStatus = 0 or null
    const qb = AppDataSource.getRepository(Employee).createQueryBuilder("emp")
      .leftJoin("emp.employeeTeams", "et")
      .leftJoinAndSelect("emp.employeeJobs", "ej")
      .leftJoinAndSelect("ej.jobTitle", "jt")
      .where("et.id_employee IS NULL")
      .andWhere("(emp.active_status = 0 OR emp.active_status IS NULL)");

    const employees = await qb.getMany();

    return employees.map((emp: any) => {
      const activeJob = emp.employeeJobs?.[0];
      return {
        idEmployee: emp.idEmployee,
        name: emp.name,
        lastname: emp.lastname,
        employeeCode: emp.employeeCode,
        jobTitle: activeJob?.jobTitle?.title ?? null,
      };
    });
  }

  async addMembers(idTeam: string, employeeIds: string[]) {
    const repo = AppDataSource.getRepository("employee_team");
    
    // Check which ones are already in the team to prevent duplicates
    const existing = await repo.find({ where: { idTeam } });
    const existingIds = existing.map((e: any) => e.idEmployee);
    
    const newMembers = employeeIds
      .filter(id => !existingIds.includes(id))
      .map(id => repo.create({ idTeam, idEmployee: id }));
      
    if (newMembers.length > 0) {
      await repo.save(newMembers);
    }
  }

  async removeMember(idTeam: string, idEmployee: string) {
    const repo = AppDataSource.getRepository("employee_team");
    await repo.delete({ idTeam, idEmployee });
  }
}

