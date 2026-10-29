import { Router } from "express";
import { PaymentMethodController } from "../controllers/payment-method.controller";
import { generateCrudRoutes } from "../../../shared/crud/routes/crudRoutes";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../shared/middlewares/authorize.middleware";

const paymentMethodRouter = Router();
const paymentMethodController = new PaymentMethodController();

paymentMethodRouter.use(authMiddleware);
paymentMethodRouter.use(authorize("sales.pos"));

generateCrudRoutes(paymentMethodRouter, paymentMethodController, {
  valueField: "idPaymentMethod",
  labelField: "label",
});

export default paymentMethodRouter;
