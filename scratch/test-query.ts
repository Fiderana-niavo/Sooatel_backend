import "reflect-metadata";
import AppDataSource from "../src/database/data-source";
import { Permission } from "../src/database/Entities/Permission";

async function test() {
  await AppDataSource.initialize();
  const perms = await AppDataSource.getRepository(Permission)
    .createQueryBuilder("p")
    .select(["p.id_permission AS \"idPermission\"", "p.code AS code", "p.name AS name"])
    .limit(3)
    .getRawMany();
    
  console.log(perms);
  await AppDataSource.destroy();
}

test().catch(console.error);
