import { Repository } from "typeorm";
import AppDataSource from "../../../database/data-source";
import { Permission } from "../../../database/Entities/Permission";
import { PermissionCategory } from "../../../database/Entities/PermissionCategory";
import { Role } from "../../../database/Entities/Role";
import { RolePermission } from "../../../database/Entities/RolePermission";
import { UserRole } from "../../../database/Entities/UserRole";
import { CrudService } from "../../../shared/crud/services/CrudService";
import { Paginated } from "../../../shared/types/Paginated";
import {
  RoleCreateOrUpdateDto,
  RolePermissionItem,
  RoleSearchOptions,
  RoleWithPermissions,
} from "../type/role.type";

export class RoleService extends CrudService<Role, RoleCreateOrUpdateDto, RoleCreateOrUpdateDto> {
  constructor(repository: Repository<Role> = AppDataSource.getRepository(Role)) {
    super(repository);
  }

  async findAll(options: RoleSearchOptions = {}): Promise<Paginated<Role>> {
    const pageNum = options.page ?? 1;
    const limitNum = options.limit ?? 10;
    const search = options.search ?? "";

    const qb = this.repository
      .createQueryBuilder("role")
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .orderBy("role.label", "ASC");

    if (search) {
      qb.andWhere("role.label ILIKE :s", { s: `%${search}%` });
    }

    const [records, total] = await qb.getManyAndCount();
    
    const recordsWithPerms = [];
    for (const role of records) {
      const permissions = await this.buildPermissions(role.idRole);
      recordsWithPerms.push({
        idRole: role.idRole,
        label: role.label,
        description: role.description ?? null,
        permissions,
      });
    }

    return new Paginated<Role>(recordsWithPerms as unknown as Role[], total, pageNum, limitNum);
  }

  async findOne(id: string): Promise<Role | null> {
    return this.repository.findOne({ where: { idRole: id } });
  }

  // Returns role with its permissions - used when clicking on a role in the list
  async findOneWithPermissions(id: string): Promise<RoleWithPermissions | null> {
    const role = await this.repository.findOne({ where: { idRole: id } });
    if (!role) return null;

    const permissions = await this.buildPermissions(id);

    return {
      idRole: role.idRole,
      label: role.label,
      description: role.description ?? null,
      permissions,
    };
  }

  async create(dto: RoleCreateOrUpdateDto): Promise<Role> {
    return AppDataSource.transaction(async (manager) => {
      // Check for duplicate label
      const existing = await manager.findOne(Role, { where: { label: dto.label } });
      if (existing) throw new Error("Un rôle avec ce nom existe déjà.");

      const role = manager.create(Role, {
        label: dto.label,
        description: dto.description,
      });
      const saved = await manager.save(Role, role);

      // Assign permissions
      const permissionIds = dto.permissionIds || [];
      for (const idPermission of permissionIds) {
        await manager.save(
          RolePermission,
          manager.create(RolePermission, {
            idRole: saved.idRole,
            idPermission,
          }),
        );
      }

      return saved;
    });
  }

  async update(id: string, dto: RoleCreateOrUpdateDto): Promise<void> {
    await AppDataSource.transaction(async (manager) => {
      // Update label and description
      await manager.update(Role, id, {
        label: dto.label,
        description: dto.description,
      });

      // Sync permissions
      await manager.delete(RolePermission, { idRole: id });
      const permissionIds = dto.permissionIds || [];
      for (const idPermission of permissionIds) {
        await manager.save(
          RolePermission,
          manager.create(RolePermission, {
            idRole: id,
            idPermission,
          }),
        );
      }
    });
  }

  async delete(id: string): Promise<void> {
    await AppDataSource.transaction(async (manager) => {
      const usersCount = await manager.count(UserRole, { where: { idRole: id } });
      if (usersCount > 0) {
        throw new Error(`Impossible de supprimer ce rôle car il est encore assigné à ${usersCount} utilisateur(s).`);
      }

      await manager.delete(RolePermission, { idRole: id });
      await manager.delete(Role, id);
    });
  }

  private async buildPermissions(idRole: string): Promise<RolePermissionItem[]> {
    const rps = await AppDataSource.getRepository(RolePermission).find({
      where: { idRole },
    });

    if (rps.length === 0) return [];

    const idPermissions = rps.map((rp) => rp.idPermission);

    const perms = await AppDataSource.getRepository(Permission)
      .createQueryBuilder("p")
      .leftJoin(PermissionCategory, "cat", "cat.id_category = p.id_category")
      .select([
        'p.id_permission AS "idPermission"',
        'p.permission_name AS "permissionName"',
        'p.description AS "description"',
        'cat.name AS "categoryLabel"',
      ])
      .where("p.id_permission IN (:...ids)", { ids: idPermissions })
      .getRawMany<RolePermissionItem>();

    return perms;
  }
}
