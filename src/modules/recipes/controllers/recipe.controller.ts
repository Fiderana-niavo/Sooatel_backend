import { Request, Response, NextFunction } from "express";
import { recipeService } from "../services/recipe.service";
import { ApiResponse } from "../../../shared/types/ApiResponse";

export class RecipeController {
  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const recipes = await recipeService.getAll();
      res.json(ApiResponse.success(recipes));
    } catch (err) {
      next(err);
    }
  };

  getVersions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const versions = await recipeService.getVersions(req.params.idItem as string);
      res.json(ApiResponse.success(versions));
    } catch (err) {
      next(err);
    }
  };

  getDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await recipeService.getDetails(req.params.id as string);
      res.json(ApiResponse.success(data));
    } catch (err) {
      next(err);
    }
  };

  getIngredients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await recipeService.resolveIngredients(req.params.id as string);
      res.json(ApiResponse.success(data));
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await recipeService.create(req.body);
      res.status(201).json(ApiResponse.success(data));
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await recipeService.update(req.params.id as string, req.body);
      res.json(ApiResponse.success(null));
    } catch (err) {
      next(err);
    }
  };

  setActive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await recipeService.setActive(req.params.id as string);
      res.json(ApiResponse.success(result));
    } catch (err) {
      next(err);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await recipeService.delete(req.params.id as string);
      res.json(ApiResponse.success(null));
    } catch (err) {
      next(err);
    }
  };
}

export const recipeController = new RecipeController();
