import { Router } from "express";
import { supplierPaymentController } from "../controllers/supplier-payment.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../shared/middlewares/authorize.middleware";

const router = Router();
router.use(authMiddleware);

router.get("/delivery/:id/summary", authorize("supplier.read"), supplierPaymentController.getDeliverySummary);
router.get("/supplier/:id/destinations", authorize("supplier.read"), supplierPaymentController.getAvailableDestinations);
router.get("/supplier/:id/balance", authorize("supplier.read"), supplierPaymentController.getBalance);
router.get("/purchase/:id/summary", authorize("supplier.read"), supplierPaymentController.getPurchaseSummary);
router.get("/:id", authorize("supplier.read"), supplierPaymentController.getPaymentById);
router.post("/", authorize("supplier.manage"), supplierPaymentController.createPayment);
router.put("/:id", authorize("supplier.manage"), supplierPaymentController.updatePayment);
router.post("/supplier/:id/apply-credit", authorize("supplier.manage"), supplierPaymentController.applyCredit);
export default router;
