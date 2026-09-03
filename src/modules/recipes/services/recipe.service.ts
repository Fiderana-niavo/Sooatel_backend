import AppDataSource from "../../../database/data-source";
import { Recipe } from "../../../database/Entities/Recipe";
import { RecipeDetail } from "../../../database/Entities/RecipeDetail";
import { Item } from "../../../database/Entities/Item";
import { NotFoundError, BadRequestError } from "../../../shared/errors/AppError";
import type { CreateRecipeDto, UpdateRecipeDto, FlatIngredient, RecipeTreeNode, RecipeAnalysis } from "../types/recipe.type";

export class RecipeService {
  private get recipeRepo() {
    return AppDataSource.getRepository(Recipe);
  }

  private get detailRepo() {
    return AppDataSource.getRepository(RecipeDetail);
  }

  async getAll() {
    const allRecipes = await this.recipeRepo.find({
      relations: { item: { unit: true } },
      order: { idItem: "ASC", version: "DESC" },
    });

    const grouped = new Map<string, Recipe[]>();
    for (const r of allRecipes) {
      if (!grouped.has(r.idItem)) grouped.set(r.idItem, []);
      grouped.get(r.idItem)!.push(r);
    }

    const list = Array.from(grouped.entries()).map(([idItem, versions]) => {
      const active = versions.find((v) => v.isActive) ?? versions[0];
      if (!active) return null;
      return {
        idRecipe: active.idRecipe,
        idItem: active.idItem,
        version: active.version,
        isActive: active.isActive,
        yieldQuantity: active.yieldQuantity,
        item: active.item,
        versionsCount: versions.length,
      };
    }).filter((r) => r !== null);

    return list;
  }

  async getVersions(idItem: string): Promise<Recipe[]> {
    const versions = await this.recipeRepo.find({
      where: { idItem } as any,
      relations: { item: { unit: true } },
      order: { version: "DESC" },
    });

    // Auto-backfill recipeCost for older recipes that were created before cost tracking
    for (const v of versions) {
      if (v.recipeCost == null) {
        const cost = await this.calculateCost(v.idRecipe);
        v.recipeCost = cost;
        await this.recipeRepo.update({ idRecipe: v.idRecipe }, { recipeCost: cost });
      }
    }

    return versions;
  }

  async getDetails(idRecipe: string): Promise<RecipeDetail[]> {
    return this.detailRepo.find({
      where: { idRecipe },
      relations: { ingredient: { unit: true }, itemUnit: { alternativeUnit: true } },
    });
  }

  async create(dto: CreateRecipeDto): Promise<Recipe> {
    const item = await AppDataSource.getRepository(Item).findOne({ where: { idItem: dto.idItem } as any });
    if (!item) throw new NotFoundError("Item introuvable.");
    if (!item.isProduced) throw new BadRequestError("Seuls les articles produits peuvent avoir une recette.");
    if (!dto.details || dto.details.length === 0) throw new BadRequestError("La recette doit avoir au moins un ingrédient.");
    const ingredientIds = dto.details.map((d) => d.idIngredient);
    if (new Set(ingredientIds).size !== ingredientIds.length) {
      throw new BadRequestError("Vous ne pouvez pas ajouter deux fois le même ingrédient.");
    }
    const hasInvalidQuantity = dto.details.some((d) => !d.quantity || Number(d.quantity) <= 0);
    if (hasInvalidQuantity) {
      throw new BadRequestError("La quantité d'un ingrédient doit être supérieure à 0 (elle ne peut pas être négative ou nulle).");
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const lastVersion = await this.getLastVersion(dto.idItem);
      const newVersion = lastVersion + 1;

      // Deactivate previous recipe for this item
      if (lastVersion > 0) {
        await queryRunner.manager.update(Recipe, { idItem: dto.idItem, isActive: true }, { isActive: false });
      }

      const recipe = queryRunner.manager.create(Recipe, {
        idItem: dto.idItem,
        version: newVersion,
        isActive: true,
        yieldQuantity: dto.yieldQuantity && Number(dto.yieldQuantity) > 0 ? Number(dto.yieldQuantity) : 1,
      });
      const savedRecipe = await queryRunner.manager.save(Recipe, recipe);

      const details = dto.details.map((d) =>
        queryRunner.manager.create(RecipeDetail, {
          idRecipe: savedRecipe.idRecipe,
          idIngredient: d.idIngredient,
          quantity: d.quantity,
          idItemUnit: d.idItemUnit ?? undefined,
          version: newVersion,
        })
      );
      await queryRunner.manager.save(RecipeDetail, details);

      // Calculate and persist the recipe cost based on current CMUPs
      const cost = await this.calculateCost(savedRecipe.idRecipe);
      await queryRunner.manager.update(Recipe, { idRecipe: savedRecipe.idRecipe }, { recipeCost: cost });

      await queryRunner.commitTransaction();
      return savedRecipe;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async update(idRecipe: string, dto: UpdateRecipeDto): Promise<void> {
    const recipe = await this.recipeRepo.findOne({ where: { idRecipe } as any });
    if (!recipe) throw new NotFoundError("Recette introuvable.");
    if (!dto.details || dto.details.length === 0) throw new BadRequestError("La recette doit avoir au moins un ingrédient.");
    const ingredientIds = dto.details.map((d) => d.idIngredient);
    if (new Set(ingredientIds).size !== ingredientIds.length) {
      throw new BadRequestError("Vous ne pouvez pas ajouter deux fois le même ingrédient.");
    }
    const hasInvalidQuantity = dto.details.some((d) => !d.quantity || Number(d.quantity) <= 0);
    if (hasInvalidQuantity) {
      throw new BadRequestError("La quantité d'un ingrédient doit être supérieure à 0 (elle ne peut pas être négative ou nulle).");
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Delete old details, keep same version
      await queryRunner.manager.delete(RecipeDetail, { idRecipe });

      // Update yield quantity if provided
      if (dto.yieldQuantity !== undefined && Number(dto.yieldQuantity) > 0) {
        await queryRunner.manager.update(Recipe, { idRecipe }, { yieldQuantity: Number(dto.yieldQuantity) });
      }

      const details = dto.details.map((d) =>
        queryRunner.manager.create(RecipeDetail, {
          idRecipe,
          idIngredient: d.idIngredient,
          quantity: d.quantity,
          idItemUnit: d.idItemUnit ?? undefined,
          version: recipe.version,
        })
      );
      await queryRunner.manager.save(RecipeDetail, details);

      // Recalculate and persist the recipe cost based on current CMUPs
      const cost = await this.calculateCost(idRecipe);
      await queryRunner.manager.update(Recipe, { idRecipe }, { recipeCost: cost });

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async setActive(idRecipe: string): Promise<{ createdNewVersion: boolean; newVersion?: number; activatedExistingVersion?: number }> {
    const recipe = await this.recipeRepo.findOne({
      where: { idRecipe } as any,
      relations: { item: { unit: true } },
    });
    if (!recipe) throw new NotFoundError("Recette introuvable.");

    const currentCost = await this.calculateCost(idRecipe);
    const storedCost = recipe.recipeCost ? Number(recipe.recipeCost) : null;

    // Rounding to 2 decimal places for comparison
    const isSameCost = storedCost !== null && Math.round(currentCost * 100) === Math.round(storedCost * 100);

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Deactivate all versions for this item
      await queryRunner.manager.update(Recipe, { idItem: recipe.idItem }, { isActive: false });

      if (isSameCost) {
        // Same cost: just reactivate as-is
        await queryRunner.manager.update(Recipe, { idRecipe }, { isActive: true });
        await queryRunner.commitTransaction();
        return { createdNewVersion: false };
      }

      // Different cost: check if another version already has same composition AND same new cost
      const sibling = await this.findMatchingVersion(recipe.idItem, idRecipe, currentCost);
      if (sibling) {
        // An existing version already matches — activate it directly
        await queryRunner.manager.update(Recipe, { idRecipe: sibling.idRecipe }, { isActive: true });
        await queryRunner.commitTransaction();
        return { createdNewVersion: false, activatedExistingVersion: sibling.version };
      }

      // No match: create a new version with the same composition but updated cost
      const lastVersion = await this.getLastVersion(recipe.idItem);
      const newVersion = lastVersion + 1;

      const newRecipe = queryRunner.manager.create(Recipe, {
        idItem: recipe.idItem,
        version: newVersion,
        isActive: true,
        yieldQuantity: recipe.yieldQuantity,
        recipeCost: currentCost,
      });
      const savedRecipe = await queryRunner.manager.save(Recipe, newRecipe);

      // Copy all details from the old recipe to the new one
      const oldDetails = await this.detailRepo.find({ where: { idRecipe } });
      const newDetails = oldDetails.map((d) =>
        queryRunner.manager.create(RecipeDetail, {
          idRecipe: savedRecipe.idRecipe,
          idIngredient: d.idIngredient,
          quantity: d.quantity,
          idItemUnit: d.idItemUnit ?? undefined,
          version: newVersion,
        })
      );
      await queryRunner.manager.save(RecipeDetail, newDetails);

      await queryRunner.commitTransaction();
      return { createdNewVersion: true, newVersion };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async delete(idRecipe: string): Promise<void> {
    const recipe = await this.recipeRepo.findOne({ where: { idRecipe } as any });
    if (!recipe) throw new NotFoundError("Recette introuvable.");
    await this.detailRepo.delete({ idRecipe });
    await this.recipeRepo.delete({ idRecipe });
  }

  async resolveIngredients(idRecipe: string): Promise<RecipeAnalysis> {
    const recipe = await this.recipeRepo.findOne({
      where: { idRecipe } as any,
      relations: { item: { unit: true } },
    });
    if (!recipe || !recipe.item) throw new NotFoundError("Recette introuvable.");

    const accumulator = new Map<string, FlatIngredient>();
    const tree = await this.resolveRecursive(idRecipe, 1, accumulator, new Set());

    const rootNode: RecipeTreeNode = {
      idIngredient: recipe.idItem,
      label: recipe.item.label,
      qty: 1,
      unit: recipe.item.unit?.symbol ?? "",
      cost: tree.reduce((sum, child) => sum + child.cost, 0),
      isProduced: true,
      subRecipeId: idRecipe,
      subRecipeVersion: recipe.version,
      children: tree,
    };

    const flatIngredients = Array.from(accumulator.values()).sort((a, b) => a.label.localeCompare(b.label));

    return {
      tree: rootNode,
      flatIngredients,
      totalCost: rootNode.cost,
    };
  }

  // --- Private helpers ---

  private async getLastVersion(idItem: string): Promise<number> {
    const last = await this.recipeRepo.findOne({
      where: { idItem } as any,
      order: { version: "DESC" },
    });
    return last ? last.version : 0;
  }

  private async calculateCost(idRecipe: string): Promise<number> {
    const recipe = await this.recipeRepo.findOne({ where: { idRecipe } as any });
    if (!recipe) return 0;
    
    const accumulator = new Map<string, FlatIngredient>();
    await this.resolveRecursive(idRecipe, 1, accumulator, new Set());
    let total = 0;
    for (const ing of accumulator.values()) {
      total += ing.totalCost;
    }
    
    const yieldQty = Number(recipe.yieldQuantity) || 1;
    return total / yieldQty;
  }

  private async findMatchingVersion(
    idItem: string,
    excludeIdRecipe: string,
    targetCost: number
  ): Promise<Recipe | null> {
    // Load all other versions for this item
    const siblings = await this.recipeRepo.find({
      where: { idItem } as any,
      order: { version: "DESC" },
    });

    // Load source composition for comparison
    const sourceDetails = await this.detailRepo.find({ where: { idRecipe: excludeIdRecipe } });
    const sourceMap = new Map(sourceDetails.map((d) => [d.idIngredient, { qty: Number(d.quantity), unit: d.idItemUnit ?? null }]));

    for (const sibling of siblings) {
      if (sibling.idRecipe === excludeIdRecipe) continue;

      // Check cost (rounded to 2 decimals)
      const siblingCost = sibling.recipeCost ? Number(sibling.recipeCost) : null;
      if (siblingCost === null || Math.round(siblingCost * 100) !== Math.round(targetCost * 100)) continue;

      // Check composition
      const siblingDetails = await this.detailRepo.find({ where: { idRecipe: sibling.idRecipe } });
      if (siblingDetails.length !== sourceDetails.length) continue;

      const isSameCompo = siblingDetails.every((d) => {
        const src = sourceMap.get(d.idIngredient);
        return src && Number(d.quantity) === src.qty && (d.idItemUnit ?? null) === src.unit;
      });

      if (isSameCompo) return sibling;
    }

    return null;
  }

  private async resolveRecursive(
    idRecipe: string,
    multiplier: number,
    accumulator: Map<string, FlatIngredient>,
    visited: Set<string>
  ): Promise<RecipeTreeNode[]> {
    if (visited.has(idRecipe)) return [];
    visited.add(idRecipe);

    const details = await this.detailRepo.find({
      where: { idRecipe },
      relations: {
        ingredient: { unit: true },
        itemUnit: true,
      },
    });

    const nodes: RecipeTreeNode[] = [];

    for (const detail of details) {
      const ingredient = detail.ingredient;
      if (!ingredient) continue;

      let qty = Number(detail.quantity) * multiplier;
      if (detail.idItemUnit && detail.itemUnit) {
        qty /= Number(detail.itemUnit.toStockRatio);
      }
      
      const cmup = Number(ingredient.weightedAverageCost) || 0;
      const nodeCost = qty * cmup;
      const unit = ingredient.unit?.symbol ?? "";

      const node: RecipeTreeNode = {
        idIngredient: ingredient.idItem,
        label: ingredient.label,
        qty: qty, // This is already multiplied by the parent's multiplier
        unit: unit,
        cost: nodeCost,
        isProduced: ingredient.isProduced,
      };

      if (ingredient.isProduced) {
        const subRecipe = await this.recipeRepo.findOne({
          where: { idItem: ingredient.idItem, isActive: true } as any,
        });
        if (subRecipe) {
          node.subRecipeId = subRecipe.idRecipe;
          node.subRecipeVersion = subRecipe.version;
          node.children = await this.resolveRecursive(subRecipe.idRecipe, qty, accumulator, visited);
          // If it's a sub-recipe, its cost is the sum of its children's costs
          node.cost = node.children.reduce((sum, child) => sum + child.cost, 0);
        }
      }

      nodes.push(node);

      if (!ingredient.isProduced) {
        // Accumulate raw ingredient for the flat list
        const existing = accumulator.get(ingredient.idItem);
        if (existing) {
          existing.totalQty += qty;
          existing.totalCost += nodeCost;
        } else {
          accumulator.set(ingredient.idItem, {
            idIngredient: ingredient.idItem,
            label: ingredient.label,
            unit,
            totalQty: qty,
            totalCost: nodeCost,
          });
        }
      }
    }
    
    return nodes;
  }
}

export const recipeService = new RecipeService();
