import { Router } from "express";
import { supplierPaymentController } from "../controllers/supplier-payment.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

const router = Router();
router.use(authMiddleware);

// Créer un paiement avec allocations
router.post("/", supplierPaymentController.createPayment);

// Résumé de paiement d une livraison
router.get("/delivery/:id/summary", supplierPaymentController.getDeliverySummary);

// Destinations disponibles pour un fournisseur
router.get("/supplier/:id/destinations", supplierPaymentController.getAvailableDestinations);

// Solde fournisseur
router.get("/supplier/:id/balance", supplierPaymentController.getBalance);


router.get("/:id", supplierPaymentController.getPaymentById);
router.put("/:id", supplierPaymentController.updatePayment);
router.get("/purchase/:id/summary", supplierPaymentController.getPurchaseSummary);
export default router;
