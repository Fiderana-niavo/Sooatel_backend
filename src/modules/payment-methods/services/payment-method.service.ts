import { Repository } from "typeorm";
import AppDataSource from "../../../database/data-source";
import { PaymentMethod } from "../../../database/Entities/PaymentMethod";
import { CrudService } from "../../../shared/crud/services/CrudService";
import { PaymentMethodDto } from "../types/payment-method.type";

export class PaymentMethodService extends CrudService<PaymentMethod, PaymentMethodDto, PaymentMethodDto> {
  constructor(repository: Repository<PaymentMethod> = AppDataSource.getRepository(PaymentMethod)) {
    super(repository);
  }
}
