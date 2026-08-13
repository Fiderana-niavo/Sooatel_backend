import { Repository, FindOptionsWhere } from "typeorm";
import AppDataSource from "../../../database/data-source";
import { SuppliedItem } from "../../../database/Entities/SuppliedItem";
import { CrudService } from "../../../shared/crud/services/CrudService";
import { Paginated } from "../../../shared/types/Paginated";
import { SuppliedItemDto } from "../type/supplier.type";

import { ConflictError } from "../../../shared/errors/AppError";

export class SuppliedItemService extends CrudService<SuppliedItem, SuppliedItemDto, SuppliedItemDto> {
  constructor(repository: Repository<SuppliedItem> = AppDataSource.getRepository(SuppliedItem)) {
    super(repository);
  }

  async findAll(options: { page?: number; limit?: number; idSupplierProduct?: string; idItem?: string } = {}): Promise<Paginated<SuppliedItem>> {
    const pageNum = options.page ?? 1;
    const limitNum = options.limit ?? 10;

    const qb = this.repository
      .createQueryBuilder("entity")
      .leftJoinAndSelect("entity.item", "item")
      .skip((pageNum - 1) * limitNum)
      .take(limitNum);

    if (options.idSupplierProduct) {
      qb.andWhere("entity.idSupplierProduct = :idSupplierProduct", { idSupplierProduct: options.idSupplierProduct });
    }

    if (options.idItem) {
      qb.andWhere("entity.idItem = :idItem", { idItem: options.idItem });
    }

    const [records, total] = await qb.getManyAndCount();
    return new Paginated<SuppliedItem>(records, total, pageNum, limitNum);
  }

  async findBySupplier(idSupplier: string): Promise<SuppliedItem[]> {
    return this.repository
      .createQueryBuilder("suppliedItem")
      .select([
        "suppliedItem.idSuppliedItem",
        "suppliedItem.idItem",
        "suppliedItem.idSupplierProduct"
      ])
      .innerJoin("suppliedItem.supplierProduct", "supplierProduct")
      .addSelect(["supplierProduct.idSupplierProduct", "supplierProduct.actualPrice"])
      .innerJoin("suppliedItem.item", "item")
      .addSelect(["item.idItem", "item.label"])
      .where("supplierProduct.idSupplier = :idSupplier", { idSupplier })
      .getMany();
  }

  async findOne(id: string): Promise<SuppliedItem | null> {
    return this.repository.findOne({
      where: { idSuppliedItem: id } as FindOptionsWhere<SuppliedItem>,
      relations: { item: true, supplierProduct: true },
    });
  }

  async create(dto: SuppliedItemDto): Promise<SuppliedItem> {
    const existing = await this.repository.findOne({
      where: { idSupplierProduct: dto.idSupplierProduct } as FindOptionsWhere<SuppliedItem>
    });
    
    if (existing) {
      throw new ConflictError("Ce produit fournisseur est déjà lié à un article interne.");
    }
    
    const entity = new SuppliedItem();
    entity.idItem = dto.idItem;
    entity.idSupplierProduct = dto.idSupplierProduct;
    
    return await this.repository.save(entity);
  }
}
