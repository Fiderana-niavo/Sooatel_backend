import { Repository } from "typeorm";
import AppDataSource from "../../../database/data-source";
import { Room } from "../../../database/Entities/Room";
import { CrudService } from "../../../shared/crud/services/CrudService";
import { Paginated } from "../../../shared/types/Paginated";
import { RoomDto, RoomSearchOptions } from "../type/room.type";

export class RoomService extends CrudService<Room, RoomDto, RoomDto> {
  constructor(repository: Repository<Room> = AppDataSource.getRepository(Room)) {
    super(repository);
  }

  async findAll(options: RoomSearchOptions = {}): Promise<Paginated<Room>> {
    const pageNum = options.page ?? 1;
    const limitNum = options.limit ?? 10;
    const search = options.search ?? "";

    const qb = this.repository
      .createQueryBuilder("entity")
      .skip((pageNum - 1) * limitNum)
      .take(limitNum);
    if (search) {
      qb.andWhere("entity.roomNumber ILIKE :s", { s: `%${search}%` });
    }

    const [records, total] = await qb.getManyAndCount();
    return new Paginated<Room>(records, total, pageNum, limitNum);
  }

  async findOne(id: string): Promise<Room | null> {
    return this.repository.findOne({
      where: { idRoom: id } as any,
    });
  }

  async create(dto: RoomDto): Promise<Room> {
    const entity = this.repository.create({
      roomNumber: dto.roomNumber,
      idRoomType: dto.idRoomType,
      description: dto.description,
    });
    return this.repository.save(entity);
  }

  async update(id: string, dto: RoomDto): Promise<void> {
    await this.repository.update(id, {
      roomNumber: dto.roomNumber,
      idRoomType: dto.idRoomType,
      description: dto.description,
    } as any);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
