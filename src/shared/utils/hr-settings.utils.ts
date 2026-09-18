import fs from "fs";
import path from "path";

export interface HrSettings {
  LEGAL_HOURS_PER_MONTH: number;
  AVERAGE_WORKING_DAYS_PER_MONTH: number;
  CALENDAR_DAYS_PER_MONTH: number;
  DEFAULT_LEAVE_DAYS_PER_MONTH: number;
}

const settingsPath = path.join(__dirname, "../config/hr-settings.json");

export function getHrSettings(): HrSettings {
  try {
    const data = fs.readFileSync(settingsPath, "utf8");
    return JSON.parse(data) as HrSettings;
  } catch (error) {
    console.error("Erreur de lecture du fichier hr-settings.json, utilisation des valeurs par défaut.", error);
    return {
      LEGAL_HOURS_PER_MONTH: 173.33,
      AVERAGE_WORKING_DAYS_PER_MONTH: 21.67,
      CALENDAR_DAYS_PER_MONTH: 30,
      DEFAULT_LEAVE_DAYS_PER_MONTH: 2.5,
    };
  }
}

export function updateHrSettings(newSettings: Partial<HrSettings>): HrSettings {
  const currentSettings = getHrSettings();
  const updatedSettings = { ...currentSettings, ...newSettings };
  
  fs.writeFileSync(settingsPath, JSON.stringify(updatedSettings, null, 2), "utf8");
  return updatedSettings;
}
