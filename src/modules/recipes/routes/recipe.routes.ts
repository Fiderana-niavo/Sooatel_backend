import { Router } from "express";
import { recipeController } from "../controllers/recipe.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

const recipeRouter = Router();

recipeRouter.use(authMiddleware);

recipeRouter.get("/", recipeController.getAll);
recipeRouter.get("/item/:idItem/versions", recipeController.getVersions);
recipeRouter.get("/:id/details", recipeController.getDetails);
recipeRouter.get("/:id/ingredients", recipeController.getIngredients);
recipeRouter.post("/", recipeController.create);
recipeRouter.put("/:id", recipeController.update);
recipeRouter.put("/:id/active", recipeController.setActive);
recipeRouter.delete("/:id", recipeController.remove);

export default recipeRouter;
