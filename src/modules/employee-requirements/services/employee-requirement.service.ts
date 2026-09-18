import { Repository } from "typeorm";
import AppDataSource from "../../../database/data-source";
import { EmployeeRequirement } from "../../../database/Entities/EmployeeRequirement";
import { CrudService } from "../../../shared/crud/services/CrudService";
import { Paginated } from "../../../shared/types/Paginated";
import {
  EmployeeRequirementDto,
  EmployeeRequirementResponse,
  EmployeeRequirementSearchOptions,
  EmployeeRequirementBulkDto,
} from "../type/employee-requirement.type";
import { DAY_LABELS } from "../../../shared/constants/app.constants";

export class EmployeeRequirementService extends CrudService<
  EmployeeRequirement,
  EmployeeRequirementDto,
  EmployeeRequirementDto
> {
  constructor(
    repository: Repository<EmployeeRequirement> = AppDataSource.getRepository(EmployeeRequirement),
  ) {
    super(repository);
  }

  async findRequirements(
    options: EmployeeRequirementSearchOptions = {},
  ): Promise<Paginated<EmployeeRequirementResponse>> {
    const pageNum = options.page ?? 1;
    const limitNum = options.limit ?? 100;

    const qb = this.repository
      .createQueryBuilder("req")
      .leftJoinAndSelect("req.shiftType", "st")
      .leftJoinAndSelect("req.jobTitle", "jt")
      .orderBy("req.dayOfWeek", "ASC")
      .addOrderBy("st.customStartTime", "ASC")
      .skip((pageNum - 1) * limitNum)
      .take(limitNum);

    if (options.idJobTitle) {
      qb.andWhere("req.id_job_title = :idJobTitle", { idJobTitle: options.idJobTitle });
    }

    if (options.idShiftType) {
      qb.andWhere("req.id_shift_type = :idShiftType", { idShiftType: options.idShiftType });
    }

    if (options.dayOfWeek !== undefined) {
      qb.andWhere("req.day_of_week = :dayOfWeek", { dayOfWeek: options.dayOfWeek });
    }

    const [records, total] = await qb.getManyAndCount();
    return new Paginated<EmployeeRequirementResponse>(
      records.map((r) => this.toResponse(r)),
      total,
      pageNum,
      limitNum
    );
  }

  async findRequirement(id: string): Promise<EmployeeRequirementResponse | null> {
    const record = await this.repository
      .createQueryBuilder("req")
      .leftJoinAndSelect("req.shiftType", "st")
      .leftJoinAndSelect("req.jobTitle", "jt")
      .where("req.id_requirement = :id", { id })
      .getOne();

    if (!record) return null;
    return this.toResponse(record);
  }

  async createRequirement(dto: EmployeeRequirementDto): Promise<EmployeeRequirementResponse> {
    const existing = await this.repository.findOne({
      where: {
        dayOfWeek: dto.dayOfWeek,
        idShiftType: dto.idShiftType,
        idJobTitle: dto.idJobTitle,
      },
    });

    if (existing) {
      throw new Error("Un besoin en effectif existe déjà pour ce poste, ce shift et ce jour.");
    }

    const record = this.repository.create({
      dayOfWeek: dto.dayOfWeek,
      requiredCount: dto.requiredCount,
      idShiftType: dto.idShiftType,
      idJobTitle: dto.idJobTitle,
    });

    const saved = await this.repository.save(record);
    const full = await this.findRequirement(saved.idRequirement);
    return full as EmployeeRequirementResponse;
  }

  async updateRequirement(id: string, dto: EmployeeRequirementDto): Promise<void> {
    const existing = await this.repository.findOne({
      where: {
        dayOfWeek: dto.dayOfWeek,
        idShiftType: dto.idShiftType,
        idJobTitle: dto.idJobTitle,
      },
    });

    if (existing && existing.idRequirement !== id) {
      throw new Error("Un besoin en effectif existe déjà pour ce poste, ce shift et ce jour.");
    }

    await this.repository.update(id, {
      dayOfWeek: dto.dayOfWeek,
      requiredCount: dto.requiredCount,
      idShiftType: dto.idShiftType,
      idJobTitle: dto.idJobTitle,
    });
  }

  async deleteRequirement(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async bulkCreate(dtos: EmployeeRequirementBulkDto[]): Promise<{ created: number; skipped: number }> {
    // 1. Vérification des doublons dans les données envoyées (payload)
    const requestedPairs = new Set<string>();
    for (const dto of dtos) {
      for (const dayOfWeek of dto.dayOfWeeks) {
        for (const idShiftType of dto.idShiftTypes) {
          const key = `${dayOfWeek}-${idShiftType}-${dto.idJobTitle}`;
          if (requestedPairs.has(key)) {
            throw new Error(`Conflit dans la requête : vous avez envoyé plusieurs fois le jour ${DAY_LABELS[dayOfWeek]} pour le même shift.`);
          }
          requestedPairs.add(key);
        }
      }
    }

    // 2. Vérification avec la base de données
    for (const dto of dtos) {
      for (const dayOfWeek of dto.dayOfWeeks) {
        for (const idShiftType of dto.idShiftTypes) {
          const existing = await this.repository.findOne({
            where: { dayOfWeek, idShiftType, idJobTitle: dto.idJobTitle },
          });

          if (existing) {
            throw new Error(`Un besoin en effectif existe déjà pour ce poste, ce shift et le jour ${DAY_LABELS[dayOfWeek]}.`);
          }
        }
      }
    }

    // 3. Sauvegarde
    let created = 0;
    for (const dto of dtos) {
      for (const dayOfWeek of dto.dayOfWeeks) {
        for (const idShiftType of dto.idShiftTypes) {
          await this.repository.save(
            this.repository.create({
              dayOfWeek,
              requiredCount: dto.requiredCount,
              idShiftType,
              idJobTitle: dto.idJobTitle,
            }),
          );
          created++;
        }
      }
    }

    return { created, skipped: 0 };
  }

  private toResponse(record: EmployeeRequirement): EmployeeRequirementResponse {
    return {
      idRequirement: record.idRequirement,
      dayOfWeek: record.dayOfWeek,
      requiredCount: record.requiredCount,
      idShiftType: record.idShiftType,
      shiftLabel: record.shiftType?.label ?? null,
      idJobTitle: record.idJobTitle,
      jobTitle: record.jobTitle?.title ?? null,
    };
  }
}
