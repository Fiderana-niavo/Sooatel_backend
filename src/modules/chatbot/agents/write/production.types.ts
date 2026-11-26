import type { StockCheck } from "../../../dish-production/type/dish-production.type";

// ─── Production Agent Types ──────────────────────────────────────────────────

// One dish mentioned by the user, with its own quantity (null = not provided)
export interface ProductionEntry {
  dish: string;
  quantity: number | null;
}

// Structured extraction of the user message (date/time null = "now")
export interface ProductionPlan {
  entries: ProductionEntry[];
  date: string | null;
  time: string | null;
  notes: string | null;
}

export interface DishOption {
  idItem: string;
  label: string;
}

export interface ResolvedEntry {
  idItem: string;
  label: string;
  quantity: number;
}

export type DishMatch =
  | { status: "found"; dish: DishOption }
  | { status: "missing" }
  | { status: "ambiguous"; options: string[] };

export interface EntryCheck {
  resolved: ResolvedEntry[];
  issues: string[];
  notFound: boolean;
}

export interface CreatedEntry extends ResolvedEntry {
  stock: StockCheck;
}

export interface InsertOutcome {
  created: CreatedEntry[];
  failed: Array<{ label: string; reason: string }>;
}
