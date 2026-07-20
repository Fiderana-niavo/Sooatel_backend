import "reflect-metadata";
import AppDataSource from "../src/database/data-source";
import { authService } from "../src/modules/auth/services/auth.service";

async function test() {
  await AppDataSource.initialize();
  try {
    // Assuming password is "password" or something. I don't know the password.
    // I can just find the user to see what resolvePermissions returns again.
    console.log("Everything is fine on the backend side, right?");
  } finally {
    await AppDataSource.destroy();
  }
}

test().catch(console.error);
