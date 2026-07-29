import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../shared/middlewares/authorize.middleware";

const router = Router();
const controller = new PaymentController();

// Create a payment for an invoice
router.post(
  "/:idInvoice",
  authMiddleware,
  authorize("sale.manage"),
  controller.addPayment.bind(controller)
);

export default router;
