export const JOB_STATUS = {
  CONFIRMED: 0,
  CANCELLED: -3,
  PENDING: 5,
} as const;

export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

export const LEAVE_TRANSACTION_TYPE = {
  ALLOCATION: "ALLOCATION",
  USAGE: "UTILISATION",
  ADVANCE: "AVANCE",
  CANCELLATION: "ANNULATION",
  ADJUSTMENT: "AJUSTEMENT",
  SALARY_DEDUCTION: "DEDUCTION_SALAIRE",
} as const;

export type LeaveTransactionType = (typeof LEAVE_TRANSACTION_TYPE)[keyof typeof LEAVE_TRANSACTION_TYPE];

// How a leave type interacts with the annual leave balance
export const DEDUCTION_MODE = {
  ALWAYS: "ALWAYS",     // Always deducted from the annual balance (negative balance allowed)
  NEVER: "NEVER",       // Never deducted, uses its own independent balance
  OPTIONAL: "OPTIONAL", // User decides at request time (no cap allowed)
} as const;

export type DeductionMode = (typeof DEDUCTION_MODE)[keyof typeof DEDUCTION_MODE];

// Period over which the cap is evaluated
export const CAP_PERIOD = {
  ANNUAL: "ANNUAL",       // Cap resets each calendar year
  LIFETIME: "LIFETIME",   // One-time cap over the entire contract
} as const;

export type CapPeriod = (typeof CAP_PERIOD)[keyof typeof CAP_PERIOD];

