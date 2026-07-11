import { BaseEntity, DeepPartial, FindOptionsWhere, Repository } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { Paginated } from "../../types/Paginated";

export class CrudService<T extends BaseEntity, CreateDto = Partial<T>, UpdateDto = Partial<T>> {
  constructor(public repository: Repository<T>) {}

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
    try {
      const entity = await this.repository.findOne({
        where: { id } as unknown as FindOptionsWhere<T>,
      });
      return entity;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Error finding entity: ${error.message}`);
      } else {
        throw new Error("Une erreur inconnue est survenue");
      }
    }
  }

  async create(entity: CreateDto): Promise<T> {
    try {
      const created = this.repository.create(entity as unknown as DeepPartial<T>);
      return await this.repository.save(created);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Error creating entity: ${error.message}`);
      } else {
        throw new Error("Une erreur inconnue est survenue");
      }
    }
  }

  async update(id: string, entity: UpdateDto): Promise<void> {
    try {
      await this.repository.update(id, entity as unknown as QueryDeepPartialEntity<T>);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Error updating entity: ${error.message}`);
      } else {
        throw new Error("Une erreur inconnue est survenue");
      }
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.repository.delete(id);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Error deleting entity: ${error.message}`);
      } else {
        throw new Error("Une erreur inconnue est survenue");
      }
    }
  }
}
