import "reflect-metadata";
import AppDataSource from "../src/database/data-source";
import { User } from "../src/database/Entities/User";
import { UserRole } from "../src/database/Entities/UserRole";
import { Role } from "../src/database/Entities/Role";

async function test() {
  await AppDataSource.initialize();
  const users = await AppDataSource.getRepository(User).find({ relations: { employee: true } });
  
  const malalas = users.filter(u => 
    u.username.toLowerCase().includes("malala") || 
    (u.employee && u.employee.name.toLowerCase().includes("malala")) ||
    (u.employee && u.employee.lastname.toLowerCase().includes("malala"))
  );

  console.log(`Found ${malalas.length} users matching 'malala':`);
  for (const m of malalas) {
    const roles = await AppDataSource.getRepository(UserRole).find({ where: { idUser: m.idUser } });
    console.log(`- Username: ${m.username}, Name: ${m.employee?.name} ${m.employee?.lastname}`);
    console.log(`  Roles count: ${roles.length}`);
  }
  await AppDataSource.destroy();
}

test().catch(console.error);
