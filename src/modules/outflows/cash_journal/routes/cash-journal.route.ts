import { Router } from "express";
import { cashJournalController } from "../controllers/cash-journal.controller";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";

const cashJournalRouter = Router();

cashJournalRouter.use(authMiddleware);

cashJournalRouter.get("/", cashJournalController.findAll);
cashJournalRouter.get("/:id", cashJournalController.getOne);
cashJournalRouter.post("/", cashJournalController.save);
cashJournalRouter.put("/:id", cashJournalController.update);
cashJournalRouter.delete("/:id", cashJournalController.remove);

export default cashJournalRouter;
