import { Repository } from "typeorm";
import { z } from "zod";
import AppDataSource from "../../../database/data-source";
import { School } from "../../../database/Entities/School";
import { CrudService } from "../../../shared/crud/services/CrudService";
import { AppError } from "../../../shared/errors/AppError";
import { SchoolCreateOrUpdateDto } from "../type/school.type";

export class SchoolService extends CrudService<
  School,
  SchoolCreateOrUpdateDto,
  SchoolCreateOrUpdateDto
> {
  constructor(repository: Repository<School> = AppDataSource.getRepository(School)) {
    super(repository);
  }

  async create(dto: SchoolCreateOrUpdateDto): Promise<School> {
    const schema = z.object({
      name: z.string().min(1, "Le nom est requis."),
      address: z.string().optional().nullable(),
      email: z.string().email("Format d'email invalide.").or(z.literal("")).optional().nullable(),
      phone: z.string().or(z.literal("")).optional().nullable(),
    });

    const parsed = schema.safeParse(dto);
    if (!parsed.success) {
      const erreurs = parsed.error.issues.map(issue => issue.message);
      throw new AppError(erreurs.join(" | "), 400);
    }

    const existing = await this.repository.findOneBy({ name: dto.name.trim() });
    if (existing) {
      throw new AppError("Une école avec ce nom existe déjà.", 400);
    }

    const school = this.repository.create({
      name: dto.name.trim(),
      address: dto.address?.trim(),
      email: dto.email?.trim(),
      phone: dto.phone?.trim(),
    });

    return await this.repository.save(school);
  }

  async update(id: string, dto: SchoolCreateOrUpdateDto): Promise<void> {
    const schema = z.object({
      name: z.string().min(1, "Le nom est requis."),
      address: z.string().optional().nullable(),
      email: z.string().email("Format d'email invalide.").or(z.literal("")).optional().nullable(),
      phone: z.string().or(z.literal("")).optional().nullable(),
    });

    const parsed = schema.safeParse(dto);
    if (!parsed.success) {
      const erreurs = parsed.error.issues.map(issue => issue.message);
      throw new AppError(erreurs.join(" | "), 400);
    }

    await this.repository.update(id, {
      name: dto.name.trim(),
      address: dto.address?.trim(),
      email: dto.email?.trim(),
      phone: dto.phone?.trim(),
    });
  }
}
