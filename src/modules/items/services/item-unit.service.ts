import { Repository } from "typeorm";
import { AppError } from "../../../shared/errors/AppError";
import AppDataSource from "../../../database/data-source";
import { ItemUnit } from "../../../database/Entities/ItemUnit";
import { Item } from "../../../database/Entities/Item";
import { CrudService } from "../../../shared/crud/services/CrudService";
import { Paginated } from "../../../shared/types/Paginated";
import { CreateItemUnitDto, UpdateItemUnitDto } from "../type/item-unit.type";

export class ItemUnitService extends CrudService<ItemUnit, CreateItemUnitDto, UpdateItemUnitDto> {
  constructor(repository: Repository<ItemUnit> = AppDataSource.getRepository(ItemUnit)) {
    super(repository);
  }

  async findAll(options: { page?: number; limit?: number; idItem?: string } = {}): Promise<Paginated<ItemUnit>> {
    const pageNum = options.page || 1;
    const limitNum = options.limit || 100;
    
    const whereCondition = options.idItem ? { idItem: options.idItem } : {};

    const [data, total] = await this.repository.findAndCount({
      where: whereCondition as any,
      relations: { item: true, alternativeUnit: true },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });
    
    return new Paginated<ItemUnit>(data, total, pageNum, limitNum);
  }

  async findOne(id: string): Promise<ItemUnit | null> {
    return this.repository.findOne({
      where: { idItemUnit: id } as any,
      relations: { item: true, alternativeUnit: true },
    });
  }

  async create(data: CreateItemUnitDto): Promise<ItemUnit> {
    const item = await AppDataSource.getRepository(Item).findOne({ where: { idItem: data.idItem } as any });
    if (!item) {
      throw new AppError("Article non trouvé", 404);
    }
    if (item.idUnit === data.alternativeUnitId) {
      throw new AppError("L'unité alternative ne peut pas être l'unité par défaut de l'article", 400);
    }

    const existing = await this.repository.findOne({
      where: { idItem: data.idItem, alternativeUnitId: data.alternativeUnitId },
    });
    if (existing) {
      throw new AppError("Cette unité alternative existe déjà pour cet article", 400);
    }

    const newItemUnit = this.repository.create({
      idItem: data.idItem,
      alternativeUnitId: data.alternativeUnitId,
      toStockRatio: data.toStockRatio,
    });
    const saved = await this.repository.save(newItemUnit);
    return (await this.findOne(saved.idItemUnit))!;
  }

  async update(id: string, data: UpdateItemUnitDto): Promise<void> {
    const itemUnit = await this.findOne(id);
    if (!itemUnit) {
      throw new AppError("Unité alternative non trouvée", 404);
    }

    if (data.idItem !== undefined) itemUnit.idItem = data.idItem;
    if (data.alternativeUnitId !== undefined) itemUnit.alternativeUnitId = data.alternativeUnitId;
    if (data.toStockRatio !== undefined) itemUnit.toStockRatio = data.toStockRatio;

    await this.repository.save(itemUnit);
  }
}

export const itemUnitService = new ItemUnitService();
