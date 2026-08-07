import AppDataSource from "./src/database/data-source";
import { User } from "./src/database/Entities/User";
import { RevenueService } from "./src/modules/sales/services/revenue.service";

async function run() {
  await AppDataSource.initialize();
  console.log("DB connected");
  
  // Get a real user with their employee
  const users = await AppDataSource.query(
    `SELECT u.id_user, u.username, u.id_employee FROM users u WHERE u.id_employee IS NOT NULL LIMIT 3`
  );
  console.log("Users found:", users);

  if (users.length === 0) {
    console.log("No users with employee found");
    process.exit(1);
  }

  const idEmployee = users[0].id_employee;
  console.log("Using idEmployee:", idEmployee);

  const service = new RevenueService();
  try {
    const result = await service.journalizeSales(idEmployee);
    console.log("SUCCESS:", result);
  } catch (e) {
    console.error("CAUGHT ERROR:", e);
  }

  process.exit(0);
}

run();
