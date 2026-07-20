import "reflect-metadata";
import AppDataSource from "../src/database/data-source";
import { User } from "../src/database/Entities/User";
import { authService } from "../src/modules/auth/services/auth.service";

async function test() {
  await AppDataSource.initialize();
  const user = await AppDataSource.getRepository(User).findOne({ where: { username: "malala.niriana" } });
  if (user) {
    const perms = await (authService as any).resolvePermissions(user.idUser);
    console.log("Permissions count:", perms.length);
    console.log("Permissions:", perms.map((p: any) => p.code).join(", "));
  } else {
    console.log("User not found");
  }
  await AppDataSource.destroy();
}

test().catch(console.error);
