import { Request, Response } from "express";
import { Role } from "../../../database/Entities/Role";
import { CrudController } from "../../../shared/crud/controllers/CrudController";
import { ApiResponse } from "../../../shared/types/ApiResponse";
import { RoleCreateOrUpdateDto, RoleSearchOptions } from "../type/role.type";
import { RoleService } from "../services/role.service";

export class RoleController extends CrudController<
  Role,
  RoleCreateOrUpdateDto,
  RoleCreateOrUpdateDto
> {
  constructor(service: RoleService) {
    super(service);
  }

  findAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await (this.service as RoleService).findAll({
        page: Number(req.query.page ?? 1),
        limit: Number(req.query.limit ?? 10),
        search: req.query.search as string | undefined,
      });

      // Include full details of first role to avoid extra request on initial page load
      let first = null;
      if (result.records.length > 0) {
        first = await (this.service as RoleService).findOneWithPermissions(
          result.records[0]!.idRole,
        );
      }

      res.json(ApiResponse.success({ ...result, first }));
    } catch (err: unknown) {
      console.error("findAll error:", err);
      if (err instanceof Error) {
        res.status(500).json(ApiResponse.error(err.message));
      } else {
        res.status(500).json(ApiResponse.error("Une erreur inconnue est survenue"));
      }
    }
  };

  getOne = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params["id"] as string;
      const result = await (this.service as RoleService).findOneWithPermissions(id);
      if (!result) {
        res.status(404).json(ApiResponse.error("Rôle introuvable"));
        return;
      }
      res.json(ApiResponse.success(result));
    } catch (err: unknown) {
      console.error("getOne error:", err);
      if (err instanceof Error) {
        res.status(500).json(ApiResponse.error(err.message));
      } else {
        res.status(500).json(ApiResponse.error("Une erreur inconnue est survenue"));
      }
    }
  };
}

export const roleController = new RoleController(new RoleService());
