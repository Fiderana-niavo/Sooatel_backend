export interface CreateLeaveDto {
  idEmployee: string;
  idLeaveType: string;
  startDate: string;
  endDate: string;
  leaveUnit?: string;
  notes?: string;
  deductFromAnnual?: boolean; // Used when deductionMode is OPTIONAL
}

export interface OverflowResolutionDto {
  idEmployee: string;
  idLeaveType: string;
  startDate: string;
  endDate: string;
  leaveUnit?: string;
  capDays: number;
  overflowDays: number;
  resolution: "ANNUAL" | "UNPAID";
  idAnnualLeaveType?: string;
  idUnpaidLeaveType?: string;
}

export interface OverflowCheckResponse {
  needsOverflowResolution: true;
  capDays: number;
  overflowDays: number;
  leaveTypeLabel: string;
}

export interface UpdateLeaveStatusDto {
  status: number;
}

export interface AllocateLeaveDto {
  idEmployee: string;
  idLeaveType: string;
  amount: number;
  notes?: string;
}

export interface SalaryDeductionDto {
  idEmployee: string;
  idLeaveType: string;
  amount: number;
  advanceDays: number;
  notes?: string;
}

export interface LeaveResponse {
  idLeave: string;
  ref: string;
  startDate: string;
  endDate: string;
  leaveUnit: string | null;
  status: number;
  statusLabel: string;
  idEmployee: string;
  employeeName: string | null;
  idLeaveType: string;
  leaveTypeLabel: string | null;
  isAdvance: boolean;
}

export interface LeaveBalanceResponse {
  idEmployeeLeaveBalance: string;
  idEmployee: string;
  idLeaveType: string;
  leaveTypeLabel: string | null;
  allocatedDays: number;
  usedDays: number;
  advanceDays: number;
  availableDays: number;
}

export interface LeaveTransactionResponse {
  idTransaction: string;
  transactionType: string;
  amount: number;
  createdAt: string;
  idLeave: string | null;
  idLeaveType: string;
  leaveTypeLabel: string | null;
  idEmployee: string;
}

export const LEAVE_STATUS = {
  PENDING: 5,
  APPROVED: 0,
  REJECTED: -1,
  CANCELLED: -3,
} as const;
