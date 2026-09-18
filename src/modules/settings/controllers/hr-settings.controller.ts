import { NextFunction, Request, Response } from "express";
import { getHrSettings, updateHrSettings } from "../../../shared/utils/hr-settings.utils";
import { ApiResponse } from "../../../shared/types/ApiResponse";

export class HrSettingsController {
  getSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const settings = getHrSettings();
      res.json(ApiResponse.success(settings));
    } catch (error) {
      next(error);
    }
  };

  updateSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const updatedSettings = updateHrSettings(req.body);
      res.json(ApiResponse.success(updatedSettings));
    } catch (error) {
      next(error);
    }
  };
}

export const hrSettingsController = new HrSettingsController();
