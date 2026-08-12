import { Repository, FindOptionsWhere } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import AppDataSource from "../../../database/data-source";
import { SupplierProduct } from "../../../database/Entities/SupplierProduct";
import { SupplierProductPrice } from "../../../database/Entities/SupplierProductPrice";
import { CrudService } from "../../../shared/crud/services/CrudService";
import { Paginated } from "../../../shared/types/Paginated";
import { SupplierProductDto, SupplierProductSearchOptions } from "../type/supplier.type";

export class SupplierProductService extends CrudService<SupplierProduct, SupplierProductDto, SupplierProductDto> {
  private priceRepository: Repository<SupplierProductPrice>;

  constructor(repository: Repository<SupplierProduct> = AppDataSource.getRepository(SupplierProduct)) {
    super(repository);
    this.priceRepository = AppDataSource.getRepository(SupplierProductPrice);
  }

  async findAll(options: SupplierProductSearchOptions = {}): Promise<Paginated<SupplierProduct>> {
    const pageNum = options.page ?? 1;
    const limitNum = options.limit ?? 10;
    const search = options.search ?? "";
    const idSupplier = options.idSupplier;

    const qb = this.repository
      .createQueryBuilder("entity")
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .orderBy("entity.name", "ASC");

    if (idSupplier) {
      qb.andWhere("entity.idSupplier = :idSupplier", { idSupplier });
    }

    if (search) {
      qb.andWhere("(entity.name ILIKE :s OR entity.ref ILIKE :s)", { s: `%${search}%` });
    }

    const [records, total] = await qb.getManyAndCount();
    return new Paginated<SupplierProduct>(records, total, pageNum, limitNum);
  }



  async create(dto: SupplierProductDto): Promise<SupplierProduct> {
    return await AppDataSource.transaction(async (manager) => {
      const repo = manager.getRepository(SupplierProduct);
      const priceRepo = manager.getRepository(SupplierProductPrice);

      const entity = repo.create({
        name: dto.name,
        actualPrice: dto.actualPrice,
        minPurchaseNumber: dto.minPurchaseNumber,
        idSupplier: dto.idSupplier,
        notes: dto.notes,
      });

      const savedProduct = await repo.save(entity);

      const priceEntity = priceRepo.create({
        price: savedProduct.actualPrice,
        changeDate: new Date(),
        idSupplierProduct: savedProduct.idSupplierProduct,
      });
      await priceRepo.save(priceEntity);

      return savedProduct;
    });
  }

  async update(id: string, dto: SupplierProductDto): Promise<void> {
    await this.repository.update(id, {
      name: dto.name,
      minPurchaseNumber: dto.minPurchaseNumber,
      notes: dto.notes,
    } as QueryDeepPartialEntity<SupplierProduct>);
  }

  async changePrice(idSupplierProduct: string, newPrice: number, changeDateStr?: string): Promise<void> {
    await AppDataSource.transaction(async (manager) => {
      const repo = manager.getRepository(SupplierProduct);
      const priceRepo = manager.getRepository(SupplierProductPrice);

      const changeDate = changeDateStr ? new Date(changeDateStr) : new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const changeDateOnly = new Date(changeDate);
      changeDateOnly.setHours(0, 0, 0, 0);

      const isFuture = changeDateOnly > today;

      if (!isFuture) {
        await repo.update(idSupplierProduct, { actualPrice: newPrice } as QueryDeepPartialEntity<SupplierProduct>);
      }

      const priceEntity = priceRepo.create({
        price: newPrice,
        changeDate: changeDate,
        idSupplierProduct: idSupplierProduct,
      });
      await priceRepo.save(priceEntity);
    });
  }

  async fixPriceError(idSupplierProduct: string, newPrice: number): Promise<void> {
    await AppDataSource.transaction(async (manager) => {
      const repo = manager.getRepository(SupplierProduct);
      const priceRepo = manager.getRepository(SupplierProductPrice);

      const latestPrice = await priceRepo.findOne({
        where: { idSupplierProduct: idSupplierProduct } as FindOptionsWhere<SupplierProductPrice>,
        order: { changeDate: "DESC" },
      });

      if (latestPrice) {
        await priceRepo.update(latestPrice.idSupplierProductPrice, { price: newPrice } as QueryDeepPartialEntity<SupplierProductPrice>);
      } else {
        const priceEntity = priceRepo.create({
          price: newPrice,
          changeDate: new Date(),
          idSupplierProduct: idSupplierProduct,
        });
        await priceRepo.save(priceEntity);
      }
      await repo.update(idSupplierProduct, { actualPrice: newPrice } as QueryDeepPartialEntity<SupplierProduct>);
    });
  }

  async getPriceHistory(idSupplierProduct: string): Promise<SupplierProductPrice[]> {
    return this.priceRepository.find({
      where: { idSupplierProduct } as FindOptionsWhere<SupplierProductPrice>,
      order: { changeDate: "DESC" },
    });
  }
}
