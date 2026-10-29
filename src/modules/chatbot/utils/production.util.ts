import {
  DishMatch,
  DishOption,
  EntryCheck,
  ProductionEntry,
  ProductionPlan,
} from "../agents/write/production.types";

// ─── Date / Time Helpers ─────────────────────────────────────────────────────

const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;
const TIME_FORMAT = /^([01]\d|2[0-3]):[0-5]\d$/;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatDay(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatHour(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDisplay(date: Date): string {
  const day = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  return `${day} à ${formatHour(date)}`;
}

// Missing date and/or time default to now. Returns null for impossible dates (e.g. 2026-02-31).
export function resolveProductionDate(plan: ProductionPlan, now: Date): Date | null {
  const day = plan.date ?? formatDay(now);
  const hour = plan.time ?? formatHour(now);
  const date = new Date(`${day}T${hour}:00`);
  if (Number.isNaN(date.getTime()) || formatDay(date) !== day) return null;
  return date;
}

// ─── Plan Parsing ────────────────────────────────────────────────────────────

interface RawEntry {
  dish?: unknown;
  quantity?: unknown;
}

interface RawPlan {
  entries?: unknown;
  date?: unknown;
  time?: unknown;
  notes?: unknown;
}

const EMPTY_PLAN: ProductionPlan = { entries: [], date: null, time: null, notes: null };

function cleanQuantity(value: unknown): number | null {
  const quantity = typeof value === "string" ? Number(value.replace(",", ".")) : value;
  return typeof quantity === "number" && Number.isFinite(quantity) ? quantity : null;
}

function cleanEntry(raw: RawEntry): ProductionEntry | null {
  const dish = typeof raw.dish === "string" ? raw.dish.trim() : "";
  if (!dish) return null;
  return { dish, quantity: cleanQuantity(raw.quantity) };
}

function cleanText(value: unknown, format?: RegExp): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text || (format && !format.test(text))) return null;
  return text;
}

export function parseProductionPlan(raw: string): ProductionPlan {
  try {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    const parsed = JSON.parse(cleaned) as RawPlan;
    const rawEntries = Array.isArray(parsed.entries) ? (parsed.entries as RawEntry[]) : [];
    const entries = rawEntries
      .map(cleanEntry)
      .filter((entry): entry is ProductionEntry => entry !== null);

    return {
      entries,
      date: cleanText(parsed.date, DATE_FORMAT),
      time: cleanText(parsed.time, TIME_FORMAT),
      notes: cleanText(parsed.notes),
    };
  } catch {
    return EMPTY_PLAN;
  }
}

// ─── Dish Matching ───────────────────────────────────────────────────────────
// Accent/case/plural-insensitive, whole-word matching against produced items.

function singular(word: string): string {
  return word.length > 3 && word.endsWith("s") ? word.slice(0, -1) : word;
}

export function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .map(singular)
    .join(" ");
}

function containsWords(text: string, part: string): boolean {
  return ` ${text} `.includes(` ${part} `);
}

export function matchDish(name: string, dishes: DishOption[]): DishMatch {
  const query = normalizeName(name);
  const exact = dishes.find((dish) => normalizeName(dish.label) === query);
  if (exact) return { status: "found", dish: exact };

  const partial = dishes.filter((dish) => {
    const label = normalizeName(dish.label);
    return containsWords(label, query) || containsWords(query, label);
  });
  if (partial.length === 1) return { status: "found", dish: partial[0] as DishOption };
  if (partial.length > 1) return { status: "ambiguous", options: partial.map((d) => d.label) };
  return { status: "missing" };
}

// ─── Entry Validation ────────────────────────────────────────────────────────
// All-or-nothing: every dish needs a known article and its own positive quantity.

function hasValidQuantity(entry: ProductionEntry): entry is ProductionEntry & { quantity: number } {
  return entry.quantity !== null && entry.quantity > 0;
}

function describeMatch(entry: ProductionEntry, match: DishMatch, check: EntryCheck): void {
  if (match.status === "missing") {
    check.notFound = true;
    check.issues.push(`Plat introuvable : **${entry.dish}**.`);
  } else if (match.status === "ambiguous") {
    const options = match.options.map((option) => `« ${option} »`).join(", ");
    check.issues.push(`Plat ambigu : **${entry.dish}** (${options}).`);
  }
}

function checkEntry(entry: ProductionEntry, dishes: DishOption[], check: EntryCheck): void {
  const match = matchDish(entry.dish, dishes);
  const validQuantity = hasValidQuantity(entry);

  if (!validQuantity) {
    check.issues.push(`Quantité manquante ou invalide pour **${entry.dish}**.`);
  }
  describeMatch(entry, match, check);

  if (validQuantity && match.status === "found") {
    check.resolved.push({
      idItem: match.dish.idItem,
      label: match.dish.label,
      quantity: entry.quantity,
    });
  }
}

export function validateEntries(entries: ProductionEntry[], dishes: DishOption[]): EntryCheck {
  const check: EntryCheck = { resolved: [], issues: [], notFound: false };
  entries.forEach((entry) => checkEntry(entry, dishes, check));
  return check;
}
