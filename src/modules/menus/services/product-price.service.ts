import { Repository } from "typeorm";
import AppDataSource from "../../../database/data-source";
import { ProductPrice } from "../../../database/Entities/ProductPrice";
import { CrudService } from "../../../shared/crud/services/CrudService";
import { Paginated } from "../../../shared/types/Paginated";
import { ProductPriceDto, ProductPriceSearchOptions } from "../type/product-price.type";

export class ProductPriceService extends CrudService<ProductPrice, ProductPriceDto, ProductPriceDto> {
  constructor(repository: Repository<ProductPrice> = AppDataSource.getRepository(ProductPrice)) {
    super(repository);
  }

  async findAll(options: ProductPriceSearchOptions = {}): Promise<Paginated<ProductPrice>> {
    const pageNum = options.page ?? 1;
    const limitNum = options.limit ?? 10;

    const qb = this.repository
      .createQueryBuilder("entity")
      .skip((pageNum - 1) * limitNum)
      .take(limitNum);

    const [records, total] = await qb.getManyAndCount();
    return new Paginated<ProductPrice>(records, total, pageNum, limitNum);
  }

  async findOne(id: string): Promise<ProductPrice | null> {
    return this.repository.findOne({
      where: { idProductPrice: id } as any,
    });
  }

  async create(dto: ProductPriceDto): Promise<ProductPrice> {
    const entity = this.repository.create({
      idMenu: dto.idMenu,
      specialPrice: dto.specialPrice,
      idRoomType: dto.idRoomType,
      idEvent: dto.idEvent,
    });
    return this.repository.save(entity);
  }

  async update(id: string, dto: ProductPriceDto): Promise<void> {
    await this.repository.update(id, {
      idMenu: dto.idMenu,
      specialPrice: dto.specialPrice,
      idRoomType: dto.idRoomType,
      idEvent: dto.idEvent,
    } as any);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
