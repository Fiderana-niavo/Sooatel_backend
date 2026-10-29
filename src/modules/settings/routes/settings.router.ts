import { Router } from "express";
import { hrSettingsController } from "../controllers/hr-settings.controller";
import { companySettingsController } from "../controllers/company-settings.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../shared/middlewares/authorize.middleware";

const settingsRouter = Router();

settingsRouter.use(authMiddleware);

settingsRouter.get("/hr", hrSettingsController.getSettings);
settingsRouter.put("/hr", authorize("settings.access"), hrSettingsController.updateSettings);

settingsRouter.get("/company", companySettingsController.getInfo);
settingsRouter.put("/company", authorize("manager.info"), companySettingsController.updateInfo);
settingsRouter.post("/company", authorize("manager.info"), companySettingsController.updateInfo);

export default settingsRouter;
