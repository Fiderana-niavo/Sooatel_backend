export interface EmployeeResponse {
  idEmployee: string;
  employeeCode: string;
  name: string | null;
  lastname: string | null;
  birthdate: string | null;
  address: string | null;
  emailContact: string | null;
  phoneNumber: string | null;
  notes: string | null;
}

export interface EmployeeListItem {
  idEmployee: string;
  employeeCode: string;
  name: string | null;
  lastname: string | null;
  jobTitle: string | null;
  isInternship: boolean;
  hasAccount: boolean;
}

export interface InternshipInfo {
  idInternship: string;
  schoolName: string | null;
  academicSupervisorName: string | null;
  professionnalSupervisorName: string | null;
}

export interface EmployeeJobInfo {
  idEmpJob: string;
  assignmentDate: string | null;
  endDate: string | null;
  hasFixedSchedule: boolean | null;
  jobTitle: string | null;
}

export interface EmployeeTeamDto {
  idTeam: string | null;
}

export interface EmployeeTeamInfo {
  idEmployeeTeam: string;
  idTeam: string;
  teamName: string | null;
}

export interface EmployeeAvailabilityDto {
  dayOfWeek: number;
  customStartTime: string | null;
  customEndTime: string | null;
  idShiftType: string | null;
}

export interface EmployeeAvailabilityInfo {
  idAvailability: string;
  dayOfWeek: number;
  customStartTime: string | null;
  customEndTime: string | null;
  idShiftType: string | null;
  shiftLabel: string | null;
}

export interface EmployeeDetail {
  idEmployee: string;
  employeeCode: string;
  name: string | null;
  lastname: string | null;
  birthdate: string | null;
  address: string | null;
  emailContact: string | null;
  phoneNumber: string | null;
  notes: string | null;
  job: EmployeeJobInfo | null;
  internship: InternshipInfo | null;
  team: EmployeeTeamInfo | null;
  availabilities: EmployeeAvailabilityInfo[];
}

export interface EmployeeDto {
  name?: string;
  lastname?: string;
  birthdate?: string;
  address?: string;
  emailContact?: string;
  phoneNumber?: string;
  notes?: string;
}

export interface EmployeeJobDto {
  idJobTitle: string;
  idEmploymentType: string;
  assignmentDate: string;
  endDate: string | null;
  hasFixedSchedule: boolean;
}

export interface EmployeeInternshipDto {
  schoolName: string | null;
  academicSupervisorName: string | null;
  professionnalSupervisorName: string | null;
}

export interface UserAccountDto {
  username: string;
  password?: string;
  roles: string[];
  permissionsOverrides: Array<{
    idPermission: string;
    overrideType: "grant" | "deny" | "default";
  }>;
}

export interface EmployeeCreateOrUpdateDto {
  name: string;
  lastname: string;
  birthdate?: string;
  address?: string;
  emailContact?: string;
  phoneNumber?: string;
  notes?: string;
  job?: EmployeeJobDto | null;
  internship?: EmployeeInternshipDto | null;
  userAccount?: UserAccountDto | null;
}

export interface ChangeJobDto {
  idJobTitle: string;
  idEmploymentType: string;
  assignmentDate: string;
  endDate: string | null;
  hasFixedSchedule: boolean;
  lastJobEndDate?: string;
}

export interface EndJobDto {
  endDate: string;
}

export interface EmployeeSearchOptions {
  page?: number;
  limit?: number;
  search?: string;
  idJobTitle?: string;
  hasUserAccount?: "yes" | "no";
  isInternship?: "yes" | "no";
  sortBy?: "name" | "lastname" | "employeeCode";
  sortOrder?: "ASC" | "DESC";
}
