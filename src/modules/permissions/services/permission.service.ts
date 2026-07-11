import { Repository } from "typeorm";
import AppDataSource from "../../../database/data-source";
import { Permission } from "../../../database/Entities/Permission";
import { CrudService } from "../../../shared/crud/services/CrudService";
import { Paginated } from "../../../shared/types/Paginated";
import { PermissionDto, PermissionSearchOptions } from "../type/permission.type";

export class PermissionService extends CrudService<Permission, PermissionDto, PermissionDto> {
  constructor(repository: Repository<Permission> = AppDataSource.getRepository(Permission)) {
    super(repository);
  }

  async findAll(options: PermissionSearchOptions = {}): Promise<Paginated<Permission>> {
    const pageNum = options.page ?? 1;
    const limitNum = options.limit ?? 10;
    const search = options.search ?? "";
    const sortBy = options.sortBy ?? "permissionName";
    const sortOrder = options.sortOrder ?? "ASC";

    const qb = this.repository
      .createQueryBuilder("permission")
      .leftJoinAndSelect("permission.category", "category")
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .orderBy(`permission.${sortBy}`, sortOrder);

    if (search) {
      qb.andWhere("permission.permission_name ILIKE :s", { s: `%${search}%` });
    }

    if (options?.idCategory) {
      qb.andWhere("permission.id_category = :idCategory", {
        idCategory: options.idCategory,
      });
    }

    const [records, total] = await qb.getManyAndCount();
    return new Paginated<Permission>(records, total, pageNum, limitNum);
  }

  async findOne(id: string): Promise<Permission | null> {
    return this.repository.findOne({
      where: { idPermission: id },
      relations: { category: true },
    });
  }

  async create(dto: PermissionDto): Promise<Permission> {
    const existing = await this.repository.findOne({
      where: { permissionName: dto.permissionName },
    });
    if (existing) throw new Error("Une permission avec ce nom existe déjà.");
    const permission = this.repository.create({
      permissionName: dto.permissionName,
      description: dto.description,
      idCategory: dto.idCategory,
    });
    return this.repository.save(permission);
  }

  async update(id: string, dto: PermissionDto): Promise<void> {
    await this.repository.update(id, {
      permissionName: dto.permissionName,
      description: dto.description,
      idCategory: dto.idCategory,
    });
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
