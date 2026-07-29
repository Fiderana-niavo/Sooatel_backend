import { Request, Response } from "express";
import { PaymentService } from "../services/payment.service";
import { CreatePaymentDto } from "../types/payment.type";
import { ApiResponse } from "../../../shared/types/ApiResponse";

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  async addPayment(req: Request, res: Response): Promise<void> {
    try {
      const { idInvoice } = req.params;
      const dto: CreatePaymentDto = req.body;
      const userId = req.userId;

      const invoice = await this.paymentService.payInvoice(idInvoice as string, userId, dto);
      res.json(ApiResponse.success(invoice, "Paiement ajouté avec succès"));
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json(ApiResponse.error(error.message));
      } else {
        console.error(error);
        res.status(500).json(ApiResponse.error("Erreur interne du serveur"));
      }
    }
  }
}
