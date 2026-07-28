import { IsNull, Repository, Not } from "typeorm";
import bcrypt from "bcrypt";
import { z } from "zod";
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
import { Role } from "../../../database/Entities/Role";
import { AppError } from "../../../shared/errors/AppError";
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
  EndJobDto,
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

    const repo = AppDataSource.getRepository(Employee);

    const qb = repo.createQueryBuilder("employee")
      .leftJoinAndSelect("employee.employeeJobs", "ej", "ej.end_date IS NULL")
      .leftJoinAndSelect("ej.jobTitle", "jt")
      .leftJoinAndSelect("employee.internships", "intern")
      .leftJoinAndSelect("employee.users", "u");

    if (options.status === "former") {
      qb.where("employee.active_status = -1");
    } else {
      qb.where("(employee.active_status = 0 OR employee.active_status IS NULL)");
    }

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

    qb.orderBy(`employee.${sortBy}`, sortOrder as "ASC" | "DESC");
    qb.skip((pageNum - 1) * limitNum).take(limitNum);

    const [employees, total] = await qb.getManyAndCount();

    const records: EmployeeListItem[] = employees.map(emp => ({
      idEmployee: emp.idEmployee,
      employeeCode: emp.employeeCode,
      name: emp.name,
      lastname: emp.lastname,
      jobTitle: emp.employeeJobs?.[0]?.jobTitle?.title || null,
      isInternship: emp.internships && emp.internships.length > 0,
      hasAccount: emp.users && emp.users.length > 0,
    }));

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
        'ej.id_job_title AS "idJobTitle"',
        'ej.id_employment_type AS "idEmploymentType"',
        'ej.assignment_date AS "assignmentDate"',
        'ej.end_date AS "endDate"',
        'ej.has_fixed_schedule AS "hasFixedSchedule"',
        'jt.title AS "jobTitle"',
      ])
      .where("ej.id_employee = :id", { id })
      .orderBy("ej.assignment_date", "DESC")
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
    let userAccount: any = null;
    const user = await AppDataSource.getRepository(User).findOneBy({ idEmployee: id });
    if (user) {
      const userRoles = await AppDataSource.getRepository(UserRole).find({ where: { idUser: user.idUser } });
      const roles = [];
      for (const ur of userRoles) {
        const roleObj = await AppDataSource.getRepository(Role).findOneBy({ idRole: ur.idRole });
        if (roleObj) {
          roles.push({
            idRole: roleObj.idRole,
            label: roleObj.label,
            description: roleObj.description,
          });
        }
      }
      const userPerms = await AppDataSource.getRepository(UserPermission).find({ where: { idUser: user.idUser } });
      userAccount = {
        idUser: user.idUser,
        username: user.username,
        roles: roles,
        permissionsOverrides: userPerms.map(up => ({
          idPermission: up.idPermission,
          overrideType: up.isAllowed ? "grant" : "deny"
        }))
      };
    }

    const detail: EmployeeDetail = {
      idEmployee: employee.idEmployee,
      employeeCode: employee.employeeCode,
      name: employee.name ?? null,
      lastname: employee.lastname ?? null,
      birthdate: employee.birthdate
        ? (new Date(employee.birthdate).toISOString().split("T")[0] ?? null)
        : null,
      address: employee.address ?? null,
      emailContact: employee.emailContact ?? null,
      phoneNumber: employee.phoneNumber ?? null,
      notes: employee.notes ?? null,
      job: empJob ?? null,
      internship: internship ?? null,
      team: team ?? null,
      availabilities: availabilities,
      userAccount: userAccount,
    };

    return detail;
  }

  async create(dto: EmployeeCreateOrUpdateDto): Promise<Employee> {
    const erreurs: string[] = [];

    const schema = z.object({
      name: z.string().min(1, "Le nom est requis."),
      lastname: z.string().min(1, "Le prénom est requis."),
      birthdate: z.string().optional().nullable().refine((val: string | null | undefined) => {
        if (!val) return true;
        const birthdate = new Date(val);
        const ageDifMs = Date.now() - birthdate.getTime();
        const ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970) >= 18;
      }, "L'employé doit avoir au moins 18 ans."),
      emailContact: z.string().email("Format d'email invalide.").or(z.literal("")).optional().nullable(),
      phoneNumber: z.string().min(5, "Le numéro de téléphone est trop court.").or(z.literal("")).optional().nullable(),
    });

    const parsed = schema.safeParse({
      name: dto.name,
      lastname: dto.lastname,
      birthdate: dto.birthdate,
      emailContact: dto.emailContact,
      phoneNumber: dto.phoneNumber
    });

    if (!parsed.success) {
      parsed.error.issues.forEach((issue: any) => erreurs.push(issue.message));
    }

    if (dto.phoneNumber) {
      const existingPhone = await AppDataSource.getRepository(Employee).findOneBy({ phoneNumber: dto.phoneNumber });
      if (existingPhone) erreurs.push("Ce numéro de téléphone est déjà pris.");
    }
    if (dto.emailContact) {
      const existingEmail = await AppDataSource.getRepository(Employee).findOneBy({ emailContact: dto.emailContact });
      if (existingEmail) erreurs.push("Cette adresse e-mail est déjà prise.");
    }
    if (dto.userAccount?.username) {
      const existingUser = await AppDataSource.getRepository(User).findOneBy({ username: dto.userAccount.username });
      if (existingUser) erreurs.push("Ce nom d'utilisateur est déjà pris.");
    }

    if (erreurs.length > 0) {
      throw new AppError(erreurs.join(" | "), 400);
    }

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
    const erreurs: string[] = [];

    const schema = z.object({
      name: z.string().min(1, "Le nom est requis."),
      lastname: z.string().min(1, "Le prénom est requis."),
      birthdate: z.string().optional().nullable().refine((val) => {
        if (!val) return true;
        const birthdate = new Date(val);
        const ageDifMs = Date.now() - birthdate.getTime();
        const ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970) >= 18;
      }, "L'employé doit avoir au moins 18 ans."),
      emailContact: z.string().email("Format d'email invalide.").or(z.literal("")).optional().nullable(),
      phoneNumber: z.string().min(5, "Le numéro de téléphone est trop court.").or(z.literal("")).optional().nullable(),
    });

    const parsed = schema.safeParse({
      name: dto.name,
      lastname: dto.lastname,
      birthdate: dto.birthdate,
      emailContact: dto.emailContact,
      phoneNumber: dto.phoneNumber
    });

    if (!parsed.success) {
      parsed.error.issues.forEach(issue => erreurs.push(issue.message));
    }

    if (dto.phoneNumber) {
      const existingPhone = await AppDataSource.getRepository(Employee).findOneBy({ phoneNumber: dto.phoneNumber, idEmployee: Not(id) });
      if (existingPhone) erreurs.push("Ce numéro de téléphone est déjà pris.");
    }
    if (dto.emailContact) {
      const existingEmail = await AppDataSource.getRepository(Employee).findOneBy({ emailContact: dto.emailContact, idEmployee: Not(id) });
      if (existingEmail) erreurs.push("Cette adresse e-mail est déjà prise.");
    }
    if (dto.userAccount?.username) {
      const existingUser = await AppDataSource.getRepository(User).findOneBy({ username: dto.userAccount.username, idEmployee: Not(id) });
      if (existingUser) erreurs.push("Ce nom d'utilisateur est déjà pris.");
    }

    if (erreurs.length > 0) {
      throw new AppError(erreurs.join(" | "), 400);
    }

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
        } else {
          // Create an account if the employee did not have one
          const hash = await hashPassword(dto.userAccount.password ?? "");
          const newUser = manager.create(User, {
            idEmployee: id,
            username: dto.userAccount.username,
            passwordHash: hash,
            ref: `EMP-${Date.now()}`, // fallback ref, ou aller chercher le vrai employeeCode
            activeStatus: 1,
            createdDate: new Date(),
          });
          const savedUser = await manager.save(User, newUser);

          for (const idRole of dto.userAccount.roles) {
            await manager.save(
              UserRole,
              manager.create(UserRole, { idUser: savedUser.idUser, idRole }),
            );
          }

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
      } else if (dto.userAccount === null && existingUser) {
        await manager.delete(UserRole, { idUser: existingUser.idUser });
        await manager.delete(UserPermission, { idUser: existingUser.idUser });
        await manager.delete(User, existingUser.idUser);
      }
    });
  }

  async setTeam(idEmployee: string, idTeam: string | null): Promise<void> {
    await AppDataSource.transaction(async (manager) => {
      await manager.delete(EmployeeTeam, { idEmployee });

      if (idTeam) {
        await manager.save(
          EmployeeTeam,
          manager.create(EmployeeTeam, { idEmployee, idTeam }),
        );
      }
    });
  }

  async setAvailabilities(idEmployee: string, dtos: EmployeeAvailabilityDto[]): Promise<void> {
    await AppDataSource.transaction(async (manager) => {
      const activeJob = await manager.findOne(EmployeeJob, {
        where: { idEmployee },
        order: { assignmentDate: "DESC" },
      });
      if (!activeJob) {
        throw new AppError("Cet employé n'a aucun emploi actif pour enregistrer des disponibilités.");
      }

      await manager.delete(EmployeeAvailability, { idEmpJob: activeJob.idEmpJob });

      const seenDays = new Set<number>();
      for (const dto of dtos) {
        if (seenDays.has(dto.dayOfWeek)) {
          throw new AppError("Conflit détecté : Il n'est pas possible de définir plusieurs disponibilités pour un même jour.");
        }
        seenDays.add(dto.dayOfWeek);
        
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



  async changeJob(id: string, dto: ChangeJobDto): Promise<void> {
    await AppDataSource.transaction(async (manager) => {
      // 1. Find the latest job of the employee
      const activeJob = await manager.findOne(EmployeeJob, {
        where: { idEmployee: id },
        order: { assignmentDate: "DESC" },
      });

      // 2. Validate chronology and close the previous job
      if (activeJob) {
        const newAssignment = new Date(dto.assignmentDate);
        const oldAssignment = new Date(activeJob.assignmentDate);

        if (newAssignment < oldAssignment) {
          throw new AppError("La date de début du nouveau poste doit être ultérieure à la date de début du poste précédent.");
        }

        let closingDate: Date;
        if (dto.lastJobEndDate) {
          closingDate = new Date(dto.lastJobEndDate);
          if (closingDate < oldAssignment) {
            throw new AppError("La date de fin de l'ancien poste ne peut pas être antérieure à sa date de début.");
          }
        } else {
          closingDate = new Date(newAssignment);
          closingDate.setDate(closingDate.getDate() - 1);
        }

        // Close the previous job regardless of whether it already had an end date
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

  async renewContract(id: string, dto: ChangeJobDto): Promise<void> {
    await AppDataSource.transaction(async (manager) => {
      // 1. Create the new job entry
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

      // 2. Reactivate the employee
      await manager.update(Employee, id, { activeStatus: 0 });
    });
  }

  async endJob(idEmployee: string, dto: EndJobDto): Promise<void> {
    await AppDataSource.transaction(async (manager) => {
      const activeJob = await manager.findOne(EmployeeJob, {
        where: { idEmployee },
        order: { assignmentDate: "DESC" },
      });

      if (!activeJob) {
        throw new AppError("Cet employé n'a aucun poste actif à clôturer.");
      }

      const closingDate = new Date(dto.endDate);
      const oldAssignment = new Date(activeJob.assignmentDate);
      const today = new Date();
      
      if (closingDate < oldAssignment) {
        throw new AppError("La date de fin de contrat ne peut pas être antérieure à sa date de début.");
      }
      
      if (closingDate > today) {
        throw new AppError("La date de fin de contrat ne peut pas être ultérieure à la date d'aujourd'hui.");
      }

      await manager.update(EmployeeJob, activeJob.idEmpJob, { endDate: closingDate });
      await manager.update(Employee, idEmployee, { activeStatus: -1 });
    });
  }

  async delete(id: string): Promise<void> {
    await AppDataSource.transaction(async (manager) => {
      const activeJob = await manager.findOne(EmployeeJob, {
        where: { idEmployee: id },
        order: { assignmentDate: "DESC" },
      });

      if (activeJob && !activeJob.endDate) {
        await manager.update(EmployeeJob, activeJob.idEmpJob, { endDate: new Date() });
      }

      await manager.update(Employee, id, { activeStatus: -3 });
    });
  }

  async getSalers(): Promise<{ value: string; label: string }[]> {
    const qb = this.repository.createQueryBuilder("employee");
    qb.select(["employee.idEmployee", "employee.name", "employee.lastname"]);

    const employees = await qb.getMany();
    // Use a Set to ensure unique employees (if they have multiple roles with same permission)
    const uniqueEmployees = new Map<string, typeof employees[0]>();
    for (const emp of employees) {
      if (!uniqueEmployees.has(emp.idEmployee)) {
        uniqueEmployees.set(emp.idEmployee, emp);
      }
    }

    return Array.from(uniqueEmployees.values()).map(emp => ({
      value: emp.idEmployee,
      label: `${emp.name} ${emp.lastname || ""}`.trim()
    }));
  }
}


async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}
