import { Router } from "express";
import { suppliedItemController } from "../controllers/supplied-item.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../shared/middlewares/authorize.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/list", authorize("supplier.manage"), suppliedItemController.findAll);
router.get("/supplier/:idSupplier", authorize("supplier.manage"), suppliedItemController.findBySupplier);
router.get("/:id", authorize("supplier.manage"), suppliedItemController.getOne);
router.post("/", authorize("supplier.manage"), suppliedItemController.save);
router.put("/:id", authorize("supplier.manage"), suppliedItemController.update);
router.delete("/:id", authorize("supplier.manage"), suppliedItemController.remove);

export default router;
