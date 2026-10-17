import { Router } from "express";
import { chatbotController } from "../controllers/chatbot.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

const chatbotRouter = Router();

chatbotRouter.use(authMiddleware);

// ─── Chat ─────────────────────────────────────────────────────────────────────
chatbotRouter.post("/", chatbotController.chat);

chatbotRouter.post("/index", chatbotController.indexAll);
chatbotRouter.post("/index/:filename", chatbotController.indexOne);

export default chatbotRouter;
