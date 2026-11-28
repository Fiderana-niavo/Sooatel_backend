import "reflect-metadata";
import AppDataSource from "../database/data-source";
import { SeedInitialUsers1712000000000 } from "../database/migrations/1712000000000-SeedInitialUsers";

async function run(): Promise<void> {
  try {
    await AppDataSource.initialize();
    console.log("Connected to PostgreSQL database.");

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    console.log("Executing migration: SeedInitialUsers1712000000000 up()...");
    const migration = new SeedInitialUsers1712000000000();
    await migration.up(queryRunner);
    await queryRunner.release();

    console.log("\nMigration completed successfully!");

    const userRows = (await AppDataSource.query(`
      SELECT 
        u.username,
        r.label AS role_name,
        e.name || ' ' || e.lastname AS full_name,
        e.email_contact,
        u.active_status
      FROM users u
      LEFT JOIN user_role ur ON ur.id_user = u.id_user
      LEFT JOIN role r ON r.id_role = ur.id_role
      LEFT JOIN employees e ON e.id_employee = u.id_employee
      WHERE u.username LIKE '%.sooatel'
      ORDER BY u.username;
    `)) as {
      username: string;
      role_name: string;
      full_name: string;
      email_contact: string;
      active_status: number;
    }[];

    console.log("\nUsers created and linked by the migration:");
    console.table(userRows);

    await AppDataSource.destroy();
  } catch (error: unknown) {
    console.error("Migration execution failed:", error);
    process.exit(1);
  }
}

run();
