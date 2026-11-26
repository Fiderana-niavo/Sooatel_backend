import { Router } from "express";
import { unitOfMeasureController } from "../controllers/unit-of-measure.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../shared/middlewares/authorize.middleware";

const unitOfMeasureRouter = Router();

unitOfMeasureRouter.use(authMiddleware);

unitOfMeasureRouter.get("/select", authorize("stock.read"), unitOfMeasureController.getSelect("idUnit", "label"));
unitOfMeasureRouter.get("/", authorize("stock.read"), unitOfMeasureController.findAll);
unitOfMeasureRouter.get("/:id", authorize("stock.read"), unitOfMeasureController.getOne);
unitOfMeasureRouter.post("/", authorize("stock.manage"), unitOfMeasureController.save);
unitOfMeasureRouter.put("/:id", authorize("stock.manage"), unitOfMeasureController.update);
unitOfMeasureRouter.delete("/:id", authorize("stock.manage"), unitOfMeasureController.remove);

export default unitOfMeasureRouter;
