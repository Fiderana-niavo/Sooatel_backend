const fs = require('fs');
const path = 'src/modules/employees/services/employee.service.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Add imports
content = content.replace(
  'import { IsNull, Repository } from "typeorm";',
  'import { IsNull, Repository, Not } from "typeorm";'
);
content = content.replace(
  'import bcrypt from "bcrypt";',
  'import bcrypt from "bcrypt";\nimport { z } from "zod";'
);
content = content.replace(
  'import { Role } from "../../../database/Entities/Role";',
  'import { Role } from "../../../database/Entities/Role";\nimport { AppError } from "../../../shared/errors/AppError";'
);

// 2. Add validation logic for create
const oldCreateVal =   async create(dto: EmployeeCreateOrUpdateDto): Promise<Employee> {
    if (dto.birthdate) {
      const birthdate = new Date(dto.birthdate);
      const ageDifMs = Date.now() - birthdate.getTime();
      const ageDate = new Date(ageDifMs);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      if (age < 18) {
        throw new Error("L'employé doit avoir au moins 18 ans.");
      }
    };

const newCreateVal =   async create(dto: EmployeeCreateOrUpdateDto): Promise<Employee> {
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
    };

content = content.replace(oldCreateVal, newCreateVal);

// 3. Add validation logic for update
const oldUpdateVal =   async update(id: string, dto: EmployeeCreateOrUpdateDto): Promise<void> {
    if (dto.birthdate) {
      const birthdate = new Date(dto.birthdate);
      const ageDifMs = Date.now() - birthdate.getTime();
      const ageDate = new Date(ageDifMs);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      if (age < 18) {
        throw new Error("L'employé doit avoir au moins 18 ans.");
      }
    };

const newUpdateVal =   async update(id: string, dto: EmployeeCreateOrUpdateDto): Promise<void> {
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
    };

content = content.replace(oldUpdateVal, newUpdateVal);

fs.writeFileSync(path, content, 'utf8');
