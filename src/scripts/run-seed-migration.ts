import "reflect-metadata";
import { MigrationInterface } from "typeorm";
import AppDataSource from "../database/data-source";
import { SeedInitialUsers1712000000000 } from "../database/migrations/1712000000000-SeedInitialUsers";
import { SeedDemoData1713000000000 } from "../database/migrations/1713000000000-SeedDemoData";

const SEEDS: Record<string, MigrationInterface[]> = {
  users: [new SeedInitialUsers1712000000000()],
  demo: [new SeedDemoData1713000000000()],
  all: [new SeedInitialUsers1712000000000(), new SeedDemoData1713000000000()],
};

async function run(): Promise<void> {
  const target = process.argv[2] ?? "users";
  const seeds = SEEDS[target];
  if (!seeds) {
    console.error(`Unknown seed "${target}". Use: ${Object.keys(SEEDS).join(", ")}`);
    process.exit(1);
  }

  try {
    await AppDataSource.initialize();
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    for (const seed of seeds) {
      console.log(`Executing ${seed.constructor.name}...`);
      await seed.up(queryRunner);
    }
    await queryRunner.release();
    console.log("Seed completed successfully.");
    await AppDataSource.destroy();
  } catch (error: unknown) {
    console.error("Seed execution failed:", error);
    process.exit(1);
  }
}

run();
