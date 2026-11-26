import { Repository } from "typeorm";
import AppDataSource from "../../../database/data-source";
import { EmploymentType } from "../../../database/Entities/EmploymentType";

export class EmploymentTypeService {
  constructor(
    private repository: Repository<EmploymentType> = AppDataSource.getRepository(EmploymentType),
  ) {}

  async findAll(): Promise<EmploymentType[]> {
    return this.repository.find({
      order: { label: "ASC" },
    });
  }
}

export const employmentTypeService = new EmploymentTypeService();
