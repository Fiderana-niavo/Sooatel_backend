import { Repository } from "typeorm";
import AppDataSource from "../../../database/data-source";
import { Team } from "../../../database/Entities/Team";
import { CrudService } from "../../../shared/crud/services/CrudService";
import { Paginated } from "../../../shared/types/Paginated";
import { TeamDto, TeamSearchOptions } from "../type/team.type";

export class TeamService extends CrudService<Team, TeamDto, TeamDto> {
  constructor(repository: Repository<Team> = AppDataSource.getRepository(Team)) {
    super(repository);
  }

  async findAll(options: TeamSearchOptions = {}): Promise<Paginated<Team>> {
    const pageNum = options.page ?? 1;
    const limitNum = options.limit ?? 10;
    const search = options.search ?? "";

    const qb = this.repository
      .createQueryBuilder("team")
      .skip((pageNum - 1) * limitNum)
      .take(limitNum);

    if (search) {
      qb.andWhere("team.team_name ILIKE :s", { s: `%${search}%` });
    }

    const [records, total] = await qb.getManyAndCount();
    return new Paginated<Team>(records, total, pageNum, limitNum);
  }

  async findOne(id: string): Promise<Team | null> {
    return this.repository.findOne({
      where: { idTeam: id },
    });
  }

  async create(dto: TeamDto): Promise<Team> {
    const existing = await this.repository.findOne({
      where: { teamName: dto.teamName },
    });
    if (existing) {
      throw new Error("Une équipe avec ce nom existe déjà.");
    }
    const team = this.repository.create({
      teamName: dto.teamName,
      description: dto.description,
    });
    return this.repository.save(team);
  }

  async update(id: string, dto: TeamDto): Promise<void> {
    const existing = await this.repository.findOne({
      where: { teamName: dto.teamName },
    });
    if (existing && existing.idTeam !== id) {
      throw new Error("Une équipe avec ce nom existe déjà.");
    }
    await this.repository.update(id, {
      teamName: dto.teamName,
      description: dto.description,
    });
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
