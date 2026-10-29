import { Router } from "express";
import { recipeController } from "../controllers/recipe.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { authorize } from "../../../shared/middlewares/authorize.middleware";

const recipeRouter = Router();

recipeRouter.use(authMiddleware);

recipeRouter.get("/", authorize("stock.read"), recipeController.getAll);
recipeRouter.get("/item/:idItem/versions", authorize("stock.read"), recipeController.getVersions);
recipeRouter.get("/:id/details", authorize("stock.read"), recipeController.getDetails);
recipeRouter.get("/:id/ingredients", authorize("stock.read"), recipeController.getIngredients);
recipeRouter.post("/", authorize("stock.manage"), recipeController.create);
recipeRouter.put("/:id", authorize("stock.manage"), recipeController.update);
recipeRouter.put("/:id/active", authorize("stock.manage"), recipeController.setActive);
recipeRouter.delete("/:id", authorize("stock.manage"), recipeController.remove);

export default recipeRouter;
