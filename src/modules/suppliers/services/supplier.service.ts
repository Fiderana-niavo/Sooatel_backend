import { Repository, FindOptionsWhere } from "typeorm";
import AppDataSource from "../../../database/data-source";
import { Supplier } from "../../../database/Entities/Supplier";
import { CrudService } from "../../../shared/crud/services/CrudService";
import { Paginated } from "../../../shared/types/Paginated";
import { SupplierDto, SupplierSearchOptions } from "../type/supplier.type";

export class SupplierService extends CrudService<Supplier, SupplierDto, SupplierDto> {
  constructor(repository: Repository<Supplier> = AppDataSource.getRepository(Supplier)) {
    super(repository);
  }

  async findAll(options: SupplierSearchOptions = {}): Promise<Paginated<Supplier>> {
    const pageNum = options.page ?? 1;
    const limitNum = options.limit ?? 10;
    const search = options.search ?? "";

    const qb = this.repository
      .createQueryBuilder("entity")
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .orderBy("entity.name", "ASC");

    if (search) {
      qb.andWhere("(entity.name ILIKE :s OR entity.ref ILIKE :s)", { s: `%${search}%` });
    }

    const [records, total] = await qb.getManyAndCount();
    return new Paginated<Supplier>(records, total, pageNum, limitNum);
  }


}
