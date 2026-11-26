import { Router } from "express";
import { supplierController } from "../controllers/supplier.controller";
import { supplierProductController } from "../controllers/supplier-product.controller";
import { suppliedItemController } from "../controllers/supplied-item.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../shared/middlewares/authorize.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", authorize("supplier.manage"), supplierController.findAll);
router.get("/:id", authorize("supplier.manage"), supplierController.getOne);
router.post("/", authorize("supplier.manage"), supplierController.save);
router.put("/:id", authorize("supplier.manage"), supplierController.update);
router.delete("/:id", authorize("supplier.manage"), supplierController.remove);

export default router;
