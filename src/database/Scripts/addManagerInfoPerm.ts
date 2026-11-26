import AppDataSource from "../data-source";
import { Permission } from "../Entities/Permission";
import { PermissionCategory } from "../Entities/PermissionCategory";
import { User } from "../Entities/User";
import { UserPermission } from "../Entities/UserPermission";
import { invalidateAllCache } from "../../shared/services/UserPermissionCache";

async function run() {
  await AppDataSource.initialize();
  console.log("DB Connected!");

  // 1. Ensure category 'configuration' exists
  let cat = await AppDataSource.manager.findOne(PermissionCategory, {
    where: [{ code: "configuration" }, { code: "settings" }],
  });
  if (!cat) {
    cat = new PermissionCategory();
    cat.name = "Configuration";
    cat.code = "configuration";
    await AppDataSource.manager.save(cat);
    console.log("Created category 'configuration'");
  }

  // 2. Ensure permission 'manager.info' exists
  let perm = await AppDataSource.manager.findOne(Permission, {
    where: { code: "manager.info" },
  });
  if (!perm) {
    perm = new Permission();
    perm.name = "Gérer les informations de l'entreprise";
    perm.code = "manager.info";
    perm.description = "Ajouter et modifier les informations de l'entreprise";
    perm.idCategory = cat.idCategory;
    await AppDataSource.manager.save(perm);
    console.log("Permission 'manager.info' created.");
  } else {
    console.log("Permission 'manager.info' already exists.");
  }

  // 3. Find user(s) matching malalani04 / malalaniariana04 / malala.niriana
  const targetUsernames = ["malalani04", "malalaniariana04", "malala.niriana"];
  const users = await AppDataSource.manager
    .getRepository(User)
    .createQueryBuilder("u")
    .where("u.username IN (:...names)", { names: targetUsernames })
    .getMany();

  if (users.length === 0) {
    console.warn("No user found matching:", targetUsernames);
  }

  for (const user of users) {
    let userPerm = await AppDataSource.manager.findOne(UserPermission, {
      where: {
        idUser: user.idUser,
        idPermission: perm.idPermission,
      },
    });

    if (!userPerm) {
      userPerm = new UserPermission();
      userPerm.idUser = user.idUser;
      userPerm.idPermission = perm.idPermission;
      userPerm.isAllowed = true;
      await AppDataSource.manager.save(userPerm);
      console.log(`Permission 'manager.info' granted to user ${user.username}`);
    } else {
      userPerm.isAllowed = true;
      await AppDataSource.manager.save(userPerm);
      console.log(`User ${user.username} already had permission 'manager.info' (ensured allowed).`);
    }
  }

  invalidateAllCache();
  console.log("Permission cache invalidated.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
