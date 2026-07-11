import { IsNull, Repository } from "typeorm";
import AppDataSource from "../../../database/data-source";
import { Employee } from "../../../database/Entities/Employee";
import { EmployeeJob } from "../../../database/Entities/EmployeeJob";
import { EmployeeTeam } from "../../../database/Entities/EmployeeTeam";
import { EmployeeAvailability } from "../../../database/Entities/EmployeeAvailability";
import { Team } from "../../../database/Entities/Team";
import { ShiftType } from "../../../database/Entities/ShiftType";
import { Internship } from "../../../database/Entities/Internship";
import { JobTitle } from "../../../database/Entities/JobTitle";
import { User } from "../../../database/Entities/User";
import { UserPermission } from "../../../database/Entities/UserPermission";
import { UserRole } from "../../../database/Entities/UserRole";
import { CrudService } from "../../../shared/crud/services/CrudService";
import { Paginated } from "../../../shared/types/Paginated";
import {
  ChangeJobDto,
  EmployeeCreateOrUpdateDto,
  EmployeeDetail,
  EmployeeDto,
  EmployeeJobInfo,
  EmployeeListItem,
  EmployeeSearchOptions,
  InternshipInfo,
  EmployeeTeamInfo,
  EmployeeAvailabilityInfo,
  EmployeeAvailabilityDto,
} from "../type/employee.type";

export class EmployeeService extends CrudService<
  Employee,
  EmployeeCreateOrUpdateDto,
  EmployeeCreateOrUpdateDto
> {
  constructor(repository: Repository<Employee> = AppDataSource.getRepository(Employee)) {
    super(repository);
  }

  async findAll(options: EmployeeSearchOptions = {}): Promise<Paginated<Employee>> {
    const pageNum = options.page ?? 1;
    const limitNum = options.limit ?? 10;
    const search = options.search ?? "";
    const sortBy = options.sortBy ?? "name";
    const sortOrder = options.sortOrder ?? "ASC";

    const qb = AppDataSource.getRepository(Employee)
      .createQueryBuilder("employee")
      .leftJoin(EmployeeJob, "ej", "ej.id_employee = employee.id_employee")
      .leftJoin(JobTitle, "jt", "jt.id_job_title = ej.id_job_title")
      .leftJoin(Internship, "intern", "intern.id_employee = employee.id_employee")
      .leftJoin(User, "u", "u.id_employee = employee.id_employee")
      .select([
        'employee.id_employee AS "idEmployee"',
        'employee.employee_code AS "employeeCode"',
        "employee.name AS name",
        "employee.lastname AS lastname",
        'jt.title AS "jobTitle"',
        'CASE WHEN intern.id_internship IS NOT NULL THEN true ELSE false END AS "isInternship"',
        'CASE WHEN u.id_user IS NOT NULL THEN true ELSE false END AS "hasAccount"',
      ])
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .orderBy(`employee.${sortBy}`, sortOrder);

    if (search) {
      qb.andWhere(
        "(employee.name ILIKE :s OR employee.lastname ILIKE :s OR employee.employee_code ILIKE :s)",
        { s: `%${search}%` },
      );
    }

    if (options.idJobTitle) {
      qb.andWhere("ej.id_job_title = :idJobTitle", { idJobTitle: options.idJobTitle });
    }

    if (options.hasUserAccount === "yes") {
      qb.andWhere("u.id_user IS NOT NULL");
    } else if (options.hasUserAccount === "no") {
      qb.andWhere("u.id_user IS NULL");
    }

    if (options.isInternship === "yes") {
      qb.andWhere("intern.id_internship IS NOT NULL");
    } else if (options.isInternship === "no") {
      qb.andWhere("intern.id_internship IS NULL");
    }

    const records = await qb.getRawMany<EmployeeListItem>();
    const total = await qb.getCount();

    return new Paginated<Employee>(records as unknown as Employee[], total, pageNum, limitNum);
  }

  async getById(id: string): Promise<EmployeeDetail | null> {
    const employee = await this.repository.findOne({ where: { idEmployee: id } });
    if (!employee) return null;

    const empJob = await AppDataSource.getRepository(EmployeeJob)
      .createQueryBuilder("ej")
      .leftJoin(JobTitle, "jt", "jt.id_job_title = ej.id_job_title")
      .select([
        'ej.id_emp_job AS "idEmpJob"',
        'ej.assignment_date AS "assignmentDate"',
        'ej.end_date AS "endDate"',
        'ej.has_fixed_schedule AS "hasFixedSchedule"',
        'jt.title AS "jobTitle"',
      ])
      .where("ej.id_employee = :id", { id })
      .getRawOne<EmployeeJobInfo>();

    const internship = await AppDataSource.getRepository(Internship)
      .createQueryBuilder("intern")
      .select([
        'intern.id_internship AS "idInternship"',
        'intern.school_name AS "schoolName"',
        'intern.academic_supervisor_name AS "academicSupervisorName"',
        'intern.professionnal_supervisor_name AS "professionnalSupervisorName"',
      ])
      .where("intern.id_employee = :id", { id })
      .getRawOne<InternshipInfo>();

    const team = await AppDataSource.getRepository(EmployeeTeam)
      .createQueryBuilder("et")
      .leftJoin(Team, "t", "t.id_team = et.id_team")
      .select([
        'et.id_employee_team AS "idEmployeeTeam"',
        'et.id_team AS "idTeam"',
        't.team_name AS "teamName"',
      ])
      .where("et.id_employee = :id", { id })
      .getRawOne<EmployeeTeamInfo>();

    let availabilities: EmployeeAvailabilityInfo[] = [];
    if (empJob) {
      availabilities = await AppDataSource.getRepository(EmployeeAvailability)
        .createQueryBuilder("ea")
        .leftJoin(ShiftType, "st", "st.id_shift_type = ea.id_shift_type")
        .select([
          'ea.id_availability AS "idAvailability"',
          'ea.day_of_week AS "dayOfWeek"',
          'ea.custom_start_time AS "customStartTime"',
          'ea.custom_end_time AS "customEndTime"',
          'ea.id_shift_type AS "idShiftType"',
          'st.label AS "shiftLabel"',
        ])
        .where("ea.id_emp_job = :idEmpJob", { idEmpJob: empJob.idEmpJob })
        .getRawMany<EmployeeAvailabilityInfo>();
    }

    const detail: EmployeeDetail = {
      idEmployee: employee.idEmployee,
      employeeCode: employee.employeeCode,
      name: employee.name ?? null,
      lastname: employee.lastname ?? null,
      birthdate: (employee.birthdate instanceof Date
        ? employee.birthdate.toISOString().split("T")[0]
        : null) as string | null,
      address: employee.address ?? null,
      emailContact: employee.emailContact ?? null,
      phoneNumber: employee.phoneNumber ?? null,
      notes: employee.notes ?? null,
      job: empJob ?? null,
      internship: internship ?? null,
      team: team ?? null,
      availabilities: availabilities,
    };

    return detail;
  }

  async create(dto: EmployeeCreateOrUpdateDto): Promise<Employee> {
    return AppDataSource.transaction(async (manager) => {
      // 1. Create the main employee (code is auto-generated by the database by default)
      const employee = manager.create(Employee, {
        name: dto.name,
        lastname: dto.lastname,
        birthdate: dto.birthdate ? new Date(dto.birthdate) : undefined,
        address: dto.address,
        emailContact: dto.emailContact,
        phoneNumber: dto.phoneNumber,
        notes: dto.notes,
      });
      const saved = await manager.save(Employee, employee);

      // Load database-generated values (such as employee code)
      const reloaded = await manager.findOneBy(Employee, {
        idEmployee: saved.idEmployee,
      });
      const employeeCode = reloaded?.employeeCode ?? "";

      // 2. Create the job
      if (dto.job) {
        const job = manager.create(EmployeeJob, {
          idEmployee: saved.idEmployee,
          idJobTitle: dto.job.idJobTitle,
          idEmploymentType: dto.job.idEmploymentType,
          assignmentDate: new Date(dto.job.assignmentDate),
          endDate: dto.job.endDate ? new Date(dto.job.endDate) : undefined,
          hasFixedSchedule: dto.job.hasFixedSchedule,
        });
        await manager.save(EmployeeJob, job);
      }

      // 3. Create the internship
      if (dto.internship) {
        const intern = manager.create(Internship, {
          idEmployee: saved.idEmployee,
          schoolName: dto.internship.schoolName ?? undefined,
          academicSupervisorName: dto.internship.academicSupervisorName ?? undefined,
          professionnalSupervisorName: dto.internship.professionnalSupervisorName ?? undefined,
        });
        await manager.save(Internship, intern);
      }

      // 4. Create the user account
      if (dto.userAccount) {
        const hash = await hashPassword(dto.userAccount.password ?? "");
        const user = manager.create(User, {
          idEmployee: saved.idEmployee,
          username: dto.userAccount.username,
          passwordHash: hash,
          ref: employeeCode,
          activeStatus: 1,
          createdDate: new Date(),
        });
        const savedUser = await manager.save(User, user);

        // Assign roles
        for (const idRole of dto.userAccount.roles) {
          await manager.save(
            UserRole,
            manager.create(UserRole, { idUser: savedUser.idUser, idRole }),
          );
        }

        // Assign permission overrides
        for (const override of dto.userAccount.permissionsOverrides) {
          if (override.overrideType === "default") continue;
          await manager.save(
            UserPermission,
            manager.create(UserPermission, {
              idUser: savedUser.idUser,
              idPermission: override.idPermission,
              isAllowed: override.overrideType === "grant",
            }),
          );
        }
      }

      return saved;
    });
  }

  async update(id: string, dto: EmployeeCreateOrUpdateDto): Promise<void> {
    await AppDataSource.transaction(async (manager) => {
      // 1. Update personal info
      await manager.update(Employee, id, {
        name: dto.name,
        lastname: dto.lastname,
        birthdate: dto.birthdate ? new Date(dto.birthdate) : undefined,
        address: dto.address,
        emailContact: dto.emailContact,
        phoneNumber: dto.phoneNumber,
        notes: dto.notes,
      });

      // 2. Synchronize job
      const existingJob = await manager.findOne(EmployeeJob, {
        where: { idEmployee: id },
      });
      if (dto.job) {
        if (existingJob) {
          await manager.update(EmployeeJob, existingJob.idEmpJob, {
            idJobTitle: dto.job.idJobTitle,
            idEmploymentType: dto.job.idEmploymentType,
            assignmentDate: new Date(dto.job.assignmentDate),
            endDate: dto.job.endDate ? new Date(dto.job.endDate) : undefined,
            hasFixedSchedule: dto.job.hasFixedSchedule,
          });
        } else {
          await manager.save(
            EmployeeJob,
            manager.create(EmployeeJob, {
              idEmployee: id,
              idJobTitle: dto.job.idJobTitle,
              idEmploymentType: dto.job.idEmploymentType,
              assignmentDate: new Date(dto.job.assignmentDate),
              endDate: dto.job.endDate ? new Date(dto.job.endDate) : undefined,
              hasFixedSchedule: dto.job.hasFixedSchedule,
            }),
          );
        }
      } else if (dto.job === null && existingJob) {
        await manager.delete(EmployeeJob, existingJob.idEmpJob);
      }

      // 3. Synchronize internship
      const existingIntern = await manager.findOne(Internship, {
        where: { idEmployee: id },
      });
      if (dto.internship) {
        if (existingIntern) {
          await manager.update(Internship, existingIntern.idInternship, {
            schoolName: dto.internship.schoolName ?? undefined,
            academicSupervisorName: dto.internship.academicSupervisorName ?? undefined,
            professionnalSupervisorName: dto.internship.professionnalSupervisorName ?? undefined,
          });
        } else {
          await manager.save(
            Internship,
            manager.create(Internship, {
              idEmployee: id,
              schoolName: dto.internship.schoolName ?? undefined,
              academicSupervisorName: dto.internship.academicSupervisorName ?? undefined,
              professionnalSupervisorName: dto.internship.professionnalSupervisorName ?? undefined,
            }),
          );
        }
      } else if (dto.internship === null && existingIntern) {
        await manager.delete(Internship, existingIntern.idInternship);
      }

      // 4. Synchronize user account
      const existingUser = await manager.findOne(User, { where: { idEmployee: id } });
      if (dto.userAccount) {
        if (existingUser) {
          const updates: Partial<User> = { username: dto.userAccount.username };
          if (dto.userAccount.password) {
            updates.passwordHash = await hashPassword(dto.userAccount.password);
          }
          await manager.update(User, existingUser.idUser, updates);

          // Sync roles
          await manager.delete(UserRole, { idUser: existingUser.idUser });
          for (const idRole of dto.userAccount.roles) {
            await manager.save(
              UserRole,
              manager.create(UserRole, { idUser: existingUser.idUser, idRole }),
            );
          }

          // Sync permissions
          await manager.delete(UserPermission, { idUser: existingUser.idUser });
          for (const override of dto.userAccount.permissionsOverrides) {
            if (override.overrideType === "default") continue;
            await manager.save(
              UserPermission,
              manager.create(UserPermission, {
                idUser: existingUser.idUser,
                idPermission: override.idPermission,
                isAllowed: override.overrideType === "grant",
              }),
            );
          }
        }
      } else if (dto.userAccount === null && existingUser) {
        await manager.delete(UserRole, { idUser: existingUser.idUser });
        await manager.delete(UserPermission, { idUser: existingUser.idUser });
        await manager.delete(User, existingUser.idUser);
      }
    });
  }

  async setTeam(idEmployee: string, idTeam: string): Promise<void> {
    await AppDataSource.transaction(async (manager) => {
      await manager.delete(EmployeeTeam, { idEmployee });
      await manager.save(
        EmployeeTeam,
        manager.create(EmployeeTeam, { idEmployee, idTeam }),
      );
    });
  }

  async deleteTeam(idEmployee: string): Promise<void> {
    await AppDataSource.getRepository(EmployeeTeam).delete({ idEmployee });
  }

  async setAvailabilities(idEmployee: string, dtos: EmployeeAvailabilityDto[]): Promise<void> {
    await AppDataSource.transaction(async (manager) => {
      const activeJob = await manager.findOne(EmployeeJob, {
        where: { idEmployee },
        order: { assignmentDate: "DESC" },
      });
      if (!activeJob) {
        throw new Error("Cet employé n'a aucun emploi actif pour enregistrer des disponibilités.");
      }
      
      await manager.delete(EmployeeAvailability, { idEmpJob: activeJob.idEmpJob });

      for (const dto of dtos) {
        await manager.save(
          EmployeeAvailability,
          manager.create(EmployeeAvailability, {
            idEmpJob: activeJob.idEmpJob,
            dayOfWeek: dto.dayOfWeek,
            customStartTime: dto.customStartTime ?? undefined,
            customEndTime: dto.customEndTime ?? undefined,
            idShiftType: dto.idShiftType ?? undefined,
          }),
        );
      }
    });
  }

  async deleteAvailabilities(idEmployee: string): Promise<void> {
    const activeJob = await AppDataSource.getRepository(EmployeeJob).findOne({
      where: { idEmployee },
      order: { assignmentDate: "DESC" },
    });
    if (activeJob) {
      await AppDataSource.getRepository(EmployeeAvailability).delete({ idEmpJob: activeJob.idEmpJob });
    }
  }

  async changeJob(id: string, dto: ChangeJobDto): Promise<void> {
    await AppDataSource.transaction(async (manager) => {
      // 1. Find the latest job of the employee
      const activeJob = await manager.findOne(EmployeeJob, {
        where: { idEmployee: id },
        order: { assignmentDate: "DESC" },
      });

      // 2. Close old job if it does not already have an end date set
      if (activeJob && !activeJob.endDate) {
        const newAssignment = new Date(dto.assignmentDate);
        const closingDate = new Date(newAssignment);
        closingDate.setDate(closingDate.getDate() - 1);
        await manager.update(EmployeeJob, activeJob.idEmpJob, { endDate: closingDate });
      }

      // 3. Create new job
      await manager.save(
        EmployeeJob,
        manager.create(EmployeeJob, {
          idEmployee: id,
          idJobTitle: dto.idJobTitle,
          idEmploymentType: dto.idEmploymentType,
          assignmentDate: new Date(dto.assignmentDate),
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          hasFixedSchedule: dto.hasFixedSchedule,
        }),
      );
    });
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
