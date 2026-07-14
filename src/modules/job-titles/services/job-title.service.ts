import { Repository } from "typeorm";
import AppDataSource from "../../../database/data-source";
import { JobTitle } from "../../../database/Entities/JobTitle";
import { CrudService } from "../../../shared/crud/services/CrudService";
import { Paginated } from "../../../shared/types/Paginated";
import { JobTitleDto, JobTitleSearchOptions } from "../type/job-title.type";

export class JobTitleService extends CrudService<JobTitle, JobTitleDto, JobTitleDto> {
  constructor(repository: Repository<JobTitle> = AppDataSource.getRepository(JobTitle)) {
    super(repository);
  }

  async findAll(options: JobTitleSearchOptions = {}): Promise<Paginated<JobTitle>> {
    const pageNum = options.page ?? 1;
    const limitNum = options.limit ?? 10;
    const search = options.search ?? "";

    const qb = this.repository
      .createQueryBuilder("job_title")
      .skip((pageNum - 1) * limitNum)
      .take(limitNum);

    if (search) {
      qb.andWhere("job_title.title ILIKE :s", { s: `%${search}%` });
    }

    const [records, total] = await qb.getManyAndCount();
    return new Paginated<JobTitle>(records, total, pageNum, limitNum);
  }

  async findOne(id: string): Promise<JobTitle | null> {
    return this.repository.findOne({
      where: { idJobTitle: id },
    });
  }

  async create(dto: JobTitleDto): Promise<JobTitle> {
    const existing = await this.repository.findOne({
      where: { title: dto.title },
    });
    if (existing) {
      throw new Error("Un métier avec ce titre existe déjà.");
    }
    const jobTitle = this.repository.create({
      title: dto.title,
    });
    return this.repository.save(jobTitle);
  }

  async update(id: string, dto: JobTitleDto): Promise<void> {
    const existing = await this.repository.findOne({
      where: { title: dto.title },
    });
    if (existing && existing.idJobTitle !== id) {
      throw new Error("Un métier avec ce titre existe déjà.");
    }
    await this.repository.update(id, {
      title: dto.title,
    });
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
