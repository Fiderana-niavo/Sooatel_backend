export interface EmployeeRequirementDto {
  dayOfWeek: number;
  requiredCount: number;
  idShiftType: string;
  idJobTitle: string;
}

export interface EmployeeRequirementResponse {
  idRequirement: string;
  dayOfWeek: number;
  requiredCount: number;
  idShiftType: string;
  shiftLabel: string | null;
  idJobTitle: string;
  jobTitle: string | null;
}

export interface EmployeeRequirementSearchOptions {
  page?: number;
  limit?: number;
  idJobTitle?: string;
  idShiftType?: string;
  dayOfWeek?: number;
}

export interface EmployeeRequirementBulkDto {
  dayOfWeeks: number[];     // e.g. [1, 2, 3, 4, 5] = Monday to Friday
  idShiftTypes: string[];   // one or more shift IDs
  idJobTitle: string;
  requiredCount: number;
}
