import AppDataSource from "../../../database/data-source";
import { DishProduction } from "../../../database/Entities/DishProduction";
import { Item } from "../../../database/Entities/Item";
import { Recipe } from "../../../database/Entities/Recipe";
import { RecipeDetail } from "../../../database/Entities/RecipeDetail";
import { StockMovement } from "../../../database/Entities/StockMovement";
import { BadRequestError, NotFoundError } from "../../../shared/errors/AppError";
import { Paginated } from "../../../shared/types/Paginated";
import { STOCK_MOVEMENT_STATUS, STOCK_MOVEMENT_TYPE, STOCK_MOVEMENT_DIRECTION } from "../../items/constants/stock.constants";
import type { DishProductionDto, DishProductionSearchOptions } from "../type/dish-production.type";

export class DishProductionService {
  private repository = AppDataSource.getRepository(DishProduction);
  private itemRepository = AppDataSource.getRepository(Item);



  async findAll(options: DishProductionSearchOptions = {}): Promise<Paginated<unknown>> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;

    const qb = this.repository
      .createQueryBuilder("prod")
      .select([
        "prod.idDishProduction",
        "prod.ref",
        "prod.productionDate",
        "prod.quantity",
        "prod.status",
        "prod.notes",
        "item.idItem",
        "item.label",
        "item.ref",
        "item.quantity",
        "operator.idEmployee",
        "operator.name",
        "operator.lastname",
      ])
      .leftJoin("prod.item", "item")
      .leftJoin("prod.operator", "operator");

    if (options.idItem) {
      qb.andWhere("prod.idItem = :idItem", { idItem: options.idItem });
    }
    if (options.status !== undefined) {
      qb.andWhere("prod.status = :status", { status: options.status });
    }
    if (options.startDate) {
      qb.andWhere("prod.productionDate >= :startDate", { startDate: options.startDate });
    }
    if (options.endDate) {
      qb.andWhere("prod.productionDate <= :endDate", { endDate: options.endDate });
    }

    qb.orderBy("prod.productionDate", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    const [records, total] = await qb.getManyAndCount();
    return new Paginated(records, total, page, limit);
  }

  async create(dto: DishProductionDto, idOperator: string): Promise<DishProduction> {
    const item = await this.itemRepository.findOne({ where: { idItem: dto.idItem } });
    if (!item) throw new NotFoundError("Article introuvable.");

    const prod = this.repository.create({
      idItem: dto.idItem,
      quantity: dto.quantity,
      notes: dto.notes,
      productionDate: dto.productionDate ? new Date(dto.productionDate) : new Date(),
      idOperator,
      status: STOCK_MOVEMENT_STATUS.DRAFT, // 5
    });

    return this.repository.save(prod);
  }

  async update(id: string, dto: DishProductionDto): Promise<void> {
    const prod = await this.repository.findOne({ where: { idDishProduction: id } });
    if (!prod) throw new NotFoundError("Production introuvable.");
    if (prod.status === STOCK_MOVEMENT_STATUS.VALIDATED) { // 0
      throw new BadRequestError("Impossible de modifier une production validée.");
    }

    await this.repository.update(id, {
      idItem: dto.idItem,
      quantity: dto.quantity,
      notes: dto.notes,
      productionDate: dto.productionDate ? new Date(dto.productionDate) : prod.productionDate,
    });
  }

  async delete(id: string): Promise<void> {
    const prod = await this.repository.findOne({ where: { idDishProduction: id } });
    if (!prod) throw new NotFoundError("Production introuvable.");
    if (prod.status === STOCK_MOVEMENT_STATUS.VALIDATED) {
      throw new BadRequestError("Impossible de supprimer une production validée.");
    }
    await this.repository.delete(id);
  }

  async validate(id: string, idOperator: string): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const prod = await queryRunner.manager.findOne(DishProduction, { where: { idDishProduction: id } });
      if (!prod) throw new NotFoundError("Production introuvable.");
      if (prod.status === STOCK_MOVEMENT_STATUS.VALIDATED) {
        throw new BadRequestError("Production déjà validée.");
      }

      const dishItem = await queryRunner.manager.findOne(Item, { where: { idItem: prod.idItem } });
      if (!dishItem) throw new NotFoundError("Article produit introuvable.");

      // Find active recipe
      const recipe = await queryRunner.manager.findOne(Recipe, { where: { idItem: prod.idItem, isActive: true } });
      if (!recipe) throw new BadRequestError("Aucune recette active trouvée pour cet article.");

      const recipeDetails = await queryRunner.manager.find(RecipeDetail, { 
        where: { idRecipe: recipe.idRecipe },
        relations: { ingredient: true }
      });

      if (recipeDetails.length === 0) {
        throw new BadRequestError("La recette ne contient aucun ingrédient.");
      }

      // multiplier
      const prodQty = Number(prod.quantity);
      const recipeYield = Number(recipe.yieldQuantity);
      if (recipeYield <= 0) throw new BadRequestError("Le rendement de la recette est invalide (<= 0).");
      
      const ratio = prodQty / recipeYield;

      // Check stock for all ingredients
      const itemsToUpdate: Item[] = [];
      const stockMovements: StockMovement[] = [];

      for (const detail of recipeDetails) {
        const requiredQty = Number(detail.quantity) * ratio;
        const currentStock = Number(detail.ingredient.quantity ?? 0);

        if (currentStock < requiredQty) {
          throw new BadRequestError(`Stock insuffisant pour l'ingrédient ${detail.ingredient.label}. Nécessaire : ${requiredQty.toFixed(2)}, Disponible : ${currentStock.toFixed(2)}`);
        }

        // Deduct from item
        detail.ingredient.quantity = currentStock - requiredQty;
        itemsToUpdate.push(detail.ingredient);

        // Create OUT movement
        const outMvt = queryRunner.manager.create(StockMovement, {
          idItem: detail.ingredient.idItem,
          movementDate: new Date(),
          quantity: requiredQty,
          movementType: STOCK_MOVEMENT_TYPE.MANUEL,
          direction: STOCK_MOVEMENT_DIRECTION.OUT,
          reason: `Sortie pour production de ${prodQty} ${dishItem.label} (Réf: ${prod.ref})`,
          status: STOCK_MOVEMENT_STATUS.VALIDATED,
          idOperator,
        });
        stockMovements.push(outMvt);
      }

      // Add stock for the produced dish
      const dishStock = Number(dishItem.quantity ?? 0);
      dishItem.quantity = dishStock + prodQty;
      itemsToUpdate.push(dishItem);

      // Create IN movement
      const inMvt = queryRunner.manager.create(StockMovement, {
        idItem: dishItem.idItem,
        movementDate: new Date(),
        quantity: prodQty,
        movementType: STOCK_MOVEMENT_TYPE.MANUEL,
        direction: STOCK_MOVEMENT_DIRECTION.IN,
        reason: `Entrée suite à production (Réf: ${prod.ref})`,
        status: STOCK_MOVEMENT_STATUS.VALIDATED,
        idOperator,
      });
      stockMovements.push(inMvt);

      // Save everything
      await queryRunner.manager.save(Item, itemsToUpdate);
      await queryRunner.manager.save(StockMovement, stockMovements);
      await queryRunner.manager.update(DishProduction, id, {
        status: STOCK_MOVEMENT_STATUS.VALIDATED,
        idOperator,
      });

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}

export const dishProductionService = new DishProductionService();
