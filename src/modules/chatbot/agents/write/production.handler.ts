import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import AppDataSource from "../../../../database/data-source";
import { Item } from "../../../../database/Entities/Item";
import { dishProductionService } from "../../../dish-production/services/dish-production.service";
import { PERMISSIONS } from "../../../../shared/permissions/permission.constants";
import { checkPermission } from "../../../../shared/permissions/permission.checker";
import { ChatbotGraphState } from "../../graph/graph.state";
import { ConversationTurn } from "../../services/conversation.memory";
import { getLlm } from "../../utils/llm.util";
import {
  parseProductionPlan,
  resolveProductionDate,
  validateEntries,
} from "../../utils/production.util";
import { buildProductionSystemPrompt, buildProductionUserPrompt } from "./production.prompts";
import {
  GENERIC_ERROR,
  INVALID_DATE,
  NO_EMPLOYEE,
  NO_ENTRIES,
  NO_PERMISSION,
  buildClarification,
  buildSuccess,
} from "./production.messages";
import { DishOption, InsertOutcome, ProductionPlan, ResolvedEntry } from "./production.types";
import type { StockCheck } from "../../../dish-production/type/dish-production.type";

const DEFAULT_NOTE = "Saisie via l'assistant Sooatel";
const MAX_NOTE_LENGTH = 500;

async function extractPlan(
  message: string,
  history: ConversationTurn[],
  now: Date,
): Promise<ProductionPlan> {
  const response = await getLlm(0).invoke([
    new SystemMessage(buildProductionSystemPrompt(now)),
    new HumanMessage(buildProductionUserPrompt(message, history)),
  ]);
  const raw = typeof response.content === "string" ? response.content : "{}";
  return parseProductionPlan(raw);
}

async function loadDishes(): Promise<DishOption[]> {
  const items = await AppDataSource.getRepository(Item)
    .createQueryBuilder("item")
    .select(["item.idItem", "item.label"])
    .where("(item.isProduced IS NULL OR item.isProduced = true)")
    .orderBy("item.label", "ASC")
    .getMany();
  return items.map((item) => ({ idItem: item.idItem, label: item.label }));
}

async function insertEntry(
  entry: ResolvedEntry,
  date: Date,
  notes: string,
  employeeId: string,
): Promise<void> {
  await dishProductionService.create(
    {
      idItem: entry.idItem,
      quantity: entry.quantity,
      productionDate: date.toISOString(),
      notes,
    },
    employeeId,
  );
}

async function safeStockCheck(entry: ResolvedEntry): Promise<StockCheck> {
  try {
    return await dishProductionService.checkStock(entry.idItem, entry.quantity);
  } catch (err) {
    console.error(`[WRITE:PRODUCTION] Stock check failed for "${entry.label}": ${String(err)}`);
    return { shortages: [], issue: null };
  }
}

async function insertEntries(
  entries: ResolvedEntry[],
  date: Date,
  plan: ProductionPlan,
  employeeId: string,
): Promise<InsertOutcome> {
  const outcome: InsertOutcome = { created: [], failed: [] };
  const notes = (plan.notes ?? DEFAULT_NOTE).slice(0, MAX_NOTE_LENGTH);

  for (const entry of entries) {
    try {
      await insertEntry(entry, date, notes, employeeId);
      outcome.created.push({ ...entry, stock: await safeStockCheck(entry) });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.error(`[WRITE:PRODUCTION] Insert failed for "${entry.label}": ${reason}`);
      outcome.failed.push({ label: entry.label, reason });
    }
  }
  return outcome;
}

function reply(answer: string, error?: string): Partial<ChatbotGraphState> {
  return { answer, agentUsed: "write_agent", error };
}

async function checkAccess(state: ChatbotGraphState): Promise<string | null> {
  if (!state.employeeId) return NO_EMPLOYEE;
  const granted = await checkPermission(state.userId, PERMISSIONS.STOCK_MANAGE);
  return granted ? null : NO_PERMISSION;
}

export async function handleProductionWrite(
  state: ChatbotGraphState,
): Promise<Partial<ChatbotGraphState>> {
  try {
    const denied = await checkAccess(state);
    if (denied) return reply(denied);

    const now = new Date();
    const plan = await extractPlan(state.userMessage, state.conversationHistory, now);
    if (plan.entries.length === 0) return reply(NO_ENTRIES);

    const date = resolveProductionDate(plan, now);
    if (!date) return reply(INVALID_DATE);

    const dishes = await loadDishes();
    const check = validateEntries(plan.entries, dishes);
    if (check.issues.length > 0) {
      const labels = check.notFound ? dishes.map((dish) => dish.label) : [];
      return reply(buildClarification(check.issues, labels));
    }

    const outcome = await insertEntries(check.resolved, date, plan, state.employeeId);
    return reply(buildSuccess(outcome, date));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[WRITE:PRODUCTION] Error: ${message}`);
    return reply(GENERIC_ERROR, message);
  }
}
