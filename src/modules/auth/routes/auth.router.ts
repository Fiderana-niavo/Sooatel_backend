import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { loginLimiter } from "../../../shared/middlewares/rateLimiter.middleware";

const authRouter = Router();

authRouter.post("/login", loginLimiter, authController.login);

authRouter.post("/refresh", authController.refreshToken);

authRouter.post("/users/:id/token", authController.generateToken);

authRouter.get("/users/:id/token", authController.getToken);

authRouter.post("/password/request-reset", authController.requestPasswordReset);
authRouter.post("/password/validate-key", authController.validateResetKey);
authRouter.post("/password/reset", authController.changePassword);
authRouter.post("/password/change", authController.changeAuthenticatedPassword);

export default authRouter;
