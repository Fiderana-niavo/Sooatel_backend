import { Router } from "express";
import { cashJournalController } from "../controllers/cash-journal.controller";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../../shared/middlewares/authorize.middleware";

const cashJournalRouter = Router();

cashJournalRouter.use(authMiddleware);

cashJournalRouter.get("/", authorize("sales.pos"), cashJournalController.findAll);
cashJournalRouter.get("/:id", authorize("sales.pos"), cashJournalController.getOne);
cashJournalRouter.get(
  "/:id/movements",
  authorize("sales.pos"),
  cashJournalController.getMovements,
);
cashJournalRouter.post("/open", authorize("sales.pos"), cashJournalController.openJournal);
cashJournalRouter.post(
  "/:id/close",
  authorize("sales.pos"),
  cashJournalController.closeJournal,
);
cashJournalRouter.put("/:id", authorize("sale.manage"), cashJournalController.update);
cashJournalRouter.delete("/:id", authorize("sale.manage"), cashJournalController.remove);

export default cashJournalRouter;
