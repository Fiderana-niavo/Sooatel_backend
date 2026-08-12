import { BaseEntity, DeepPartial, FindOptionsWhere, Repository } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { Paginated } from "../../types/Paginated";

export class CrudService<T extends BaseEntity, CreateDto = Partial<T>, UpdateDto = Partial<T>> {
  constructor(public repository: Repository<T>) { }

  async findAll(options: { page?: number; limit?: number } = {}): Promise<Paginated<T>> {
    const pageNum = options.page || 1;
    const limitNum = options.limit || 100;
    const data = await this.repository.find({
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });
    const total = await this.repository.count();
    return new Paginated<T>(data, total, pageNum, limitNum);
  }

  async findOne(id: string): Promise<T | null> {
    const primaryKey = this.repository.metadata.primaryColumns[0]?.propertyName || "id";
    const entity = await this.repository.findOne({
      where: { [primaryKey]: id } as unknown as FindOptionsWhere<T>,
    });
    return entity;
  }

  async create(entity: CreateDto): Promise<T> {
    const created = this.repository.create(entity as unknown as DeepPartial<T>);
    return await this.repository.save(created);
  }

  async update(id: string, entity: UpdateDto): Promise<void> {
    await this.repository.update(id, entity as unknown as QueryDeepPartialEntity<T>);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async getSelectOptions(valueField: keyof T, labelField: keyof T): Promise<{ value: string | number; label: string }[]> {
    const qb = this.repository.createQueryBuilder("entity");
    qb.select([`entity.${String(valueField)} AS value`, `entity.${String(labelField)} AS label`]);
    return await qb.getRawMany();
  }
}
