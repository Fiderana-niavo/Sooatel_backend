import "reflect-metadata";
import AppDataSource from "../src/database/data-source";
import { User } from "../src/database/Entities/User";
import { UserRole } from "../src/database/Entities/UserRole";
import { Role } from "../src/database/Entities/Role";

async function test() {
  await AppDataSource.initialize();
  const adminRole = await AppDataSource.getRepository(Role).findOne({ where: { label: "Admin" } });
  
  if (adminRole) {
    const user = await AppDataSource.getRepository(User).findOne({ where: { username: "malalani04" } });
    if (user) {
      const existing = await AppDataSource.getRepository(UserRole).findOne({ where: { idUser: user.idUser, idRole: adminRole.idRole } });
      if (!existing) {
        const ur = AppDataSource.getRepository(UserRole).create({ idUser: user.idUser, idRole: adminRole.idRole });
        await AppDataSource.getRepository(UserRole).save(ur);
        console.log("Role Admin attribué à malalani04");
      } else {
        console.log("malalani04 a déjà le role Admin");
      }
    }
  }

  await AppDataSource.destroy();
}

test().catch(console.error);
