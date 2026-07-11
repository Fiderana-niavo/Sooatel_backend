import "reflect-metadata";
import express from "express";
import cors from "cors";
import { configDotenv } from "dotenv";
import AppDataSource from "./database/data-source";
import employeeRouter from "./modules/employees/routes/employee.router";
import roleRouter from "./modules/roles/routes/role.router";
import {
  permissionRouter,
  permissionCategoryRouter,
} from "./modules/permissions/routes/permission.router";

configDotenv();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "Sooatel API running" });
});

AppDataSource.initialize()
  .then(() => {
    console.log("Database connected.");

    app.use("/api/employees", employeeRouter);
    app.use("/api/roles", roleRouter);
    app.use("/api/permissions", permissionRouter);
    app.use("/api/permission-categories", permissionCategoryRouter);

    const PORT = Number(process.env["PORT"] ?? 3000);
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err: Error) => {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  });
