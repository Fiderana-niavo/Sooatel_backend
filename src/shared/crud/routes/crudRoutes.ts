import { Router } from "express";
import { CrudController } from "../controllers/CrudController";
import { BaseEntity } from "typeorm";

export const generateCrudRoutes = <
  T extends BaseEntity,
  CreateDto = Partial<T>,
  UpdateDto = Partial<T>,
>(
  router: Router,
  controller: CrudController<T, CreateDto, UpdateDto>,
) => {
  router.get("/", controller.findAll);
  router.get("/:id", controller.getOne);
  router.post("/", controller.save);
  router.put("/:id", controller.update);
  router.delete("/:id", controller.remove);
};
