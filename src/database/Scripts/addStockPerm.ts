import AppDataSource from "../data-source";
import { Permission } from "../Entities/Permission";
import { PermissionCategory } from "../Entities/PermissionCategory";
import { Role } from "../Entities/Role";
import { RolePermission } from "../Entities/RolePermission";

async function run() {
  await AppDataSource.initialize();
  console.log("DB Connected!");

  let cat = await AppDataSource.manager.findOne(PermissionCategory, { where: { code: "stock" } });
  if (!cat) {
    cat = new PermissionCategory();
    cat.name = "Stock & Inventory";
    cat.code = "stock";
    await AppDataSource.manager.save(cat);
  }

  let stockPerm = await AppDataSource.manager.findOne(Permission, { where: { code: "stock.manage" } });
  if (!stockPerm) {
    stockPerm = new Permission();
    stockPerm.name = "Gérer les stocks";
    stockPerm.code = "stock.manage";
    stockPerm.description = "Access and manage stock";
    stockPerm.idCategory = cat.idCategory;
    await AppDataSource.manager.save(stockPerm);
    console.log("Permission stock.manage created.");
  }

  let defaultRole = await AppDataSource.manager.findOne(Role, { where: { label: "default" } });
  if (defaultRole) {
    const existing = await AppDataSource.manager.findOne(RolePermission, {
      where: { idRole: defaultRole.idRole, permission: { idPermission: stockPerm.idPermission } }
    });
    if (!existing) {
      const rp = new RolePermission();
      rp.idRole = defaultRole.idRole;
      rp.permission = stockPerm;
      await AppDataSource.manager.save(rp);
      console.log("Permission stock.manage added to default role.");
    } else {
      console.log("Permission stock.manage already in default role.");
    }
  }

  process.exit(0);
}

run().catch(console.error);
