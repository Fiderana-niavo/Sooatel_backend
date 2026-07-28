import AppDataSource from "../data-source";
import { Permission } from "../Entities/Permission";
import { PermissionCategory } from "../Entities/PermissionCategory";
import { Role } from "../Entities/Role";
import { RolePermission } from "../Entities/RolePermission";
import { User } from "../Entities/User";
import { UserRole } from "../Entities/UserRole";

async function seed() {
  await AppDataSource.initialize();
  console.log("DB Connected!");

  let cat = await AppDataSource.manager.findOne(PermissionCategory, { where: { code: "sales" } });
  if (!cat) {
    cat = new PermissionCategory();
    cat.name = "Sales";
    cat.code = "sales";
    await AppDataSource.manager.save(cat);
  }

  const oldPerm = await AppDataSource.manager.findOne(Permission, { where: { code: "sales.create" } });
  if (oldPerm) {
    oldPerm.code = "sales.pos";
    oldPerm.name = "Caisse & Ventes (Voir, Créer, Modifier)";
    await AppDataSource.manager.save(oldPerm);
    console.log("Permission sales.create renamed to sales.pos.");
  }

  let posPerm = await AppDataSource.manager.findOne(Permission, { where: { code: "sales.pos" } });
  if (!posPerm) {
    posPerm = new Permission();
    posPerm.name = "Caisse & Ventes (Voir, Créer, Modifier)";
    posPerm.code = "sales.pos";
    posPerm.description = "Access POS, view and manage sales";
    posPerm.idCategory = cat.idCategory;
    await AppDataSource.manager.save(posPerm);
    console.log("Permission sales.pos created.");
  }

  let managePerm = await AppDataSource.manager.findOne(Permission, { where: { code: "sale.manage" } });
  if (!managePerm) {
    managePerm = new Permission();
    managePerm.name = "Gérer les ventes (Rouvrir, Annuler, Supprimer)";
    managePerm.code = "sale.manage";
    managePerm.description = "Reopen, cancel and delete sales";
    managePerm.idCategory = cat.idCategory;
    await AppDataSource.manager.save(managePerm);
    console.log("Permission sale.manage created.");
  }

  let defaultRole = await AppDataSource.manager.findOne(Role, { where: { label: "default" } });
  if (!defaultRole) {
    defaultRole = new Role();
    defaultRole.label = "default";
    defaultRole.description = "Default role";
    await AppDataSource.manager.save(defaultRole);
  }

  for (const perm of [posPerm, managePerm]) {
    const existing = await AppDataSource.manager.findOne(RolePermission, {
      where: { idRole: defaultRole.idRole, permission: { idPermission: perm.idPermission } }
    });
    if (!existing) {
      const rp = new RolePermission();
      rp.idRole = defaultRole.idRole;
      rp.permission = perm;
      await AppDataSource.manager.save(rp);
    }
  }

  const users = await AppDataSource.manager.find(User, {
    where: [{ username: "fiderana" }, { username: "malalani04" }],
    relations: { userRoles: { role: true } }
  });

  for (const user of users) {
    const hasDefaultRole = user.userRoles.some(ur => ur.role.label === "default");
    if (!hasDefaultRole) {
      const ur = new UserRole();
      ur.idUser = user.idUser;
      ur.idRole = defaultRole.idRole;
      await AppDataSource.manager.save(ur);
      console.log(`Added default role to User ${user.username}`);
    } else {
      console.log(`User ${user.username} already has default role`);
    }
  }

  process.exit(0);
}

seed().catch(console.error);
