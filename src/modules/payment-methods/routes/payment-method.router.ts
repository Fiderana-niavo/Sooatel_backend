import { Router } from "express";
import { PaymentMethodController } from "../controllers/payment-method.controller";
import { generateCrudRoutes } from "../../../shared/crud/routes/crudRoutes";

const paymentMethodRouter = Router();
const paymentMethodController = new PaymentMethodController();

generateCrudRoutes(paymentMethodRouter, paymentMethodController, { valueField: "idPaymentMethod", labelField: "label" });

export default paymentMethodRouter;
