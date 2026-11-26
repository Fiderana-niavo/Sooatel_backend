import { Repository, FindOptionsWhere } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import AppDataSource from "../../../database/data-source";
import { RoomType } from "../../../database/Entities/RoomType";
import { CrudService } from "../../../shared/crud/services/CrudService";
import { Paginated } from "../../../shared/types/Paginated";
import { RoomTypeDto, RoomTypeSearchOptions } from "../type/room-type.type";

export class RoomTypeService extends CrudService<RoomType, RoomTypeDto, RoomTypeDto> {
  constructor(repository: Repository<RoomType> = AppDataSource.getRepository(RoomType)) {
    super(repository);
  }

  async findAll(options: RoomTypeSearchOptions = {}): Promise<Paginated<RoomType>> {
    const pageNum = options.page ?? 1;
    const limitNum = options.limit ?? 10;
    const search = options.search ?? "";

    const qb = this.repository
      .createQueryBuilder("entity")
      .skip((pageNum - 1) * limitNum)
      .take(limitNum);
    if (search) {
      qb.andWhere("entity.label ILIKE :s", { s: `%${search}%` });
    }

    const [records, total] = await qb.getManyAndCount();
    return new Paginated<RoomType>(records, total, pageNum, limitNum);
  }

  async findOne(id: string): Promise<RoomType | null> {
    return this.repository.findOne({
      where: { idRoomType: id } as FindOptionsWhere<RoomType>,
    });
  }

  async create(dto: RoomTypeDto): Promise<RoomType> {
    const entity = this.repository.create({
      label: dto.label,
      description: dto.description,
    });
    return this.repository.save(entity);
  }

  async update(id: string, dto: RoomTypeDto): Promise<void> {
    await this.repository.update(id, {
      label: dto.label,
      description: dto.description,
    } as QueryDeepPartialEntity<RoomType>);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
