import "reflect-metadata";
import AppDataSource from "../database/data-source";

async function run(): Promise<void> {
  try {
    await AppDataSource.initialize();
    console.log("Checking for pending database migrations...");
    const executed = await AppDataSource.runMigrations();
    if (executed.length === 0) {
      console.log("Database is already up to date. No pending migrations to run.");
    } else {
      console.log(`Successfully executed ${executed.length} pending migration(s):`);
      for (const item of executed) {
        console.log(` - ${item.name}`);
      }
    }
    await AppDataSource.destroy();
  } catch (error: unknown) {
    console.error("Migration runner failed:", error);
    process.exit(1);
  }
}

run();
