import "reflect-metadata";
import { DataSource } from "typeorm";
import { configDotenv } from "dotenv";

configDotenv();

const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env["DB_HOST"] as string,
  port: Number(process.env["DB_PORT"] ?? 5432),
  username: process.env["DB_USER"] as string,
  password: process.env["DB_PASSWORD"] as string,
  database: process.env["DB_NAME"] as string,
  synchronize: false,
  logging: ["error"],
  entities: [__dirname + "/Entities/**/*{.ts,.js}"],
  migrations: [],
  subscribers: [],
});

export default AppDataSource;
