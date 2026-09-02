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
import teamRouter from "./modules/teams/routes/team.router";
import shiftTypeRouter from "./modules/shift-types/routes/shift-type.router";
import authRouter from "./modules/auth/routes/auth.router";
import jobTitleRouter from "./modules/job-titles/routes/job-title.router";
import employmentTypeRouter from "./modules/job-titles/routes/employment-type.router";
import eventRouter from "./modules/events/routes/event.router";
import roomRouter from "./modules/rooms/routes/room.router";
import roomTypeRouter from "./modules/rooms/routes/room-type.router";
import itemRouter from "./modules/items/routes/item.router";
import itemTypeRouter from "./modules/items/routes/item-type.router";
import itemUnitRouter from "./modules/items/routes/item-unit.router";
import unitOfMeasureRouter from "./modules/items/routes/unit-of-measure.router";
import menuItemRouter from "./modules/menus/routes/menu-item.router";
import menuCategoryRouter from "./modules/menus/routes/menu-category.router";
import productPriceRouter from "./modules/menus/routes/product-price.router";
import saleRouter from "./modules/sales/routes/sale.router";
import saleDashboardRouter from "./modules/dashboard/saledashboard/routes/saledashboard.router";
import paymentMethodRouter from "./modules/payment-methods/routes/payment-method.router";
import paymentRouter from "./modules/payment/routes/payment.route";
import cashMovementCategoryRouter from "./modules/cash_movement/category/routes/cash-movement-category.route";
import cashMovementRouter from "./modules/cash_movement/movement/routes/cash-movement.route";
import cashJournalRouter from "./modules/cash_movement/cash_journal/routes/cash-journal.route";
import supplierRouter from "./modules/suppliers/routes/supplier.router";
import supplierPaymentRouter from "./modules/supplier-payment/routes/supplier-payment.routes";
import { startTokenPurgeJob } from "./shared/jobs/tokenPurge.job";
import { startSupplierPriceJob } from "./modules/suppliers/jobs/supplier-price.job";
import { globalErrorMiddleware } from "./shared/middlewares/error.middleware";

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
    app.use("/api/teams", teamRouter);
    app.use("/api/shift-types", shiftTypeRouter);
    app.use("/api/auth", authRouter);
    app.use("/api/job-titles", jobTitleRouter);
    app.use("/api/employment-types", employmentTypeRouter);

    app.use("/api/events", eventRouter);
    app.use("/api/rooms", roomRouter);
    app.use("/api/room-types", roomTypeRouter);
    app.use("/api/items", itemRouter);
    app.use("/api/item-types", itemTypeRouter);
    app.use("/api/item-units", itemUnitRouter);
    app.use("/api/unit-of-measures", unitOfMeasureRouter);
    app.use("/api/menu-items", menuItemRouter);
    app.use("/api/menu-categories", menuCategoryRouter);
    app.use("/api/product-prices", productPriceRouter);
    app.use("/api/sales", saleRouter);
    app.use("/api/dashboard/saledashboard", saleDashboardRouter);
    app.use("/api/payments", paymentRouter);
    app.use("/api/payment-methods", paymentMethodRouter);
    app.use("/api/cash-movement-categories", cashMovementCategoryRouter);
    app.use("/api/cash-movements", cashMovementRouter);
    app.use("/api/cash-journals", cashJournalRouter);
    app.use("/api/suppliers", supplierRouter);
    app.use("/api/supplier-products", require("./modules/suppliers/routes/supplier-product.router").default);
    app.use("/api/supplied-items", require("./modules/suppliers/routes/supplied-item.router").default);
    app.use("/api/purchases", require("./modules/purchases/routes/purchase.routes").default);
    app.use("/api/deliveries", require("./modules/delivery/routes/delivery.routes").default);
    app.use("/api/supplier-payments", supplierPaymentRouter);

    app.use(globalErrorMiddleware);

    const PORT = Number(process.env["PORT"] ?? 3000);
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      startTokenPurgeJob();
      startSupplierPriceJob();
    });
  })
  .catch((err: Error) => {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  });
// trigger restart
// trigger restart 2
// trigger restart 3
