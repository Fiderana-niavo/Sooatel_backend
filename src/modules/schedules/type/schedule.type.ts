export interface ScheduleDto {
  idEmployee: string;
  scheduleDate: string;
  idShiftType: string;
}

export interface SaveSchedulesPayload {
  rows: ScheduleDto[];
  overwrite: boolean;
  startDate: string;
  endDate: string;
}

export interface ScheduleResponse {
  idSchedule: string;
  scheduleDate: string;
  idEmployee: string;
  employeeName: string | null;
  idJobTitle: string | null;
  jobTitle: string | null;
  idShiftType: string | null;
  shiftLabel: string | null;
}

export interface GenerateByTeamDto {
  startDate: string;
  endDate: string;
  idRotationShift: string;
  teamIds: string[];
  shiftIds: string[];
}


export interface GeneratedScheduleRow {
  idEmployee: string;
  employeeName: string | null;
  idJobTitle: string | null;
  jobTitle: string | null;
  scheduleDate: string;
  idShiftType: string | null;
  shiftLabel: string | null;
  isOnLeave: boolean;
}

export interface AvailableEmployee {
  idEmployee: string;
  employeeName: string | null;
  idJobTitle: string | null;
  jobTitle: string | null;
  availabilities: {
    dayOfWeek: number;
    idShiftType: string | null;
    shiftLabel: string | null;
  }[];
}

export interface ScheduleRangeSearchOptions {
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

export interface AvailableEmployeesOptions {
  date?: string;
  idJobTitle?: string;
}

export interface CheckExistingResult {
  hasExisting: boolean;
  count: number;
  dates: string[];
}
