import fs from "fs";
import path from "path";

export interface TicketInfo {
  receiptTitle: string;
  legalText: string;
  thankYou: string;
}

function resolveConfigPath(): string {
  const rootPath = path.resolve(process.cwd(), "src/shared/config/ticket-info.json");
  if (fs.existsSync(rootPath)) return rootPath;
  return path.resolve(__dirname, "../config/ticket-info.json");
}

export function getTicketInfo(): TicketInfo {
  const filePath = resolveConfigPath();
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as TicketInfo;
}

export function updateTicketInfo(updates: Partial<TicketInfo>): TicketInfo {
  const filePath = resolveConfigPath();
  const current = getTicketInfo();
  const updated: TicketInfo = { ...current, ...updates };

  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), "utf8");
  return updated;
}
