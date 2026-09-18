import { getHrSettings } from "../utils/hr-settings.utils";

export function calculateHourlyRate(baseSalary: number, hoursPerMonth?: number): number {
  if (!baseSalary || baseSalary <= 0) return 0;
  const divisor = hoursPerMonth ?? getHrSettings().LEGAL_HOURS_PER_MONTH;
  return baseSalary / divisor;
}

export function calculateDailyRate(baseSalary: number, daysPerMonth?: number): number {
  if (!baseSalary || baseSalary <= 0) return 0;
  const divisor = daysPerMonth ?? getHrSettings().AVERAGE_WORKING_DAYS_PER_MONTH;
  return baseSalary / divisor;
}
