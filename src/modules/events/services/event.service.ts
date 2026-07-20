import { Repository } from "typeorm";
import AppDataSource from "../../../database/data-source";
import { Event } from "../../../database/Entities/Event";
import { CrudService } from "../../../shared/crud/services/CrudService";
import { Paginated } from "../../../shared/types/Paginated";
import { EventDto, EventSearchOptions } from "../type/event.type";

export class EventService extends CrudService<Event, EventDto, EventDto> {
  constructor(repository: Repository<Event> = AppDataSource.getRepository(Event)) {
    super(repository);
  }

  async findAll(options: EventSearchOptions = {}): Promise<Paginated<Event>> {
    const pageNum = options.page ?? 1;
    const limitNum = options.limit ?? 10;
    const search = options.search ?? "";

    const qb = this.repository
      .createQueryBuilder("entity")
      .skip((pageNum - 1) * limitNum)
      .take(limitNum);
    if (search) {
      qb.andWhere("entity.eventName ILIKE :s", { s: `%${search}%` });
    }

    const [records, total] = await qb.getManyAndCount();
    return new Paginated<Event>(records, total, pageNum, limitNum);
  }

  async findOne(id: string): Promise<Event | null> {
    return this.repository.findOne({
      where: { idEvent: id } as any,
    });
  }

  async create(dto: EventDto): Promise<Event> {
    const entity = this.repository.create({
      eventName: dto.eventName,
      startDate: dto.startDate,
      endDate: dto.endDate,
    });
    return this.repository.save(entity);
  }

  async update(id: string, dto: EventDto): Promise<void> {
    await this.repository.update(id, {
      eventName: dto.eventName,
      startDate: dto.startDate,
      endDate: dto.endDate,
    } as any);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
