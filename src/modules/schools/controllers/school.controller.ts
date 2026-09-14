import { CrudController } from "../../../shared/crud/controllers/CrudController";
import { School } from "../../../database/Entities/School";
import { SchoolCreateOrUpdateDto } from "../type/school.type";
import { SchoolService } from "../services/school.service";

export class SchoolController extends CrudController<
  School,
  SchoolCreateOrUpdateDto,
  SchoolCreateOrUpdateDto
> {
  constructor(service: SchoolService) {
    super(service);
  }
}

export const schoolController = new SchoolController(new SchoolService());
