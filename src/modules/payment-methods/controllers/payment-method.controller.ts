import { CrudController } from "../../../shared/crud/controllers/CrudController";
import { PaymentMethod } from "../../../database/Entities/PaymentMethod";
import { PaymentMethodService } from "../services/payment-method.service";

export class PaymentMethodController extends CrudController<PaymentMethod> {
  constructor() {
    super(new PaymentMethodService());
  }
}
