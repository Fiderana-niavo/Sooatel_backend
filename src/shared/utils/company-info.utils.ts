import fs from "fs";
import path from "path";

export interface CompanyInfo {
  name: string;
  subtitle: string;
  address: string;
  city: string;
  phone: string;
  mail: string;
}

function resolveConfigPath(): string {
  const rootPath = path.resolve(process.cwd(), "src/shared/config/company-info.json");
  if (fs.existsSync(rootPath)) return rootPath;
  return path.resolve(__dirname, "../config/company-info.json");
}

export function getCompanyInfo(): CompanyInfo {
  const filePath = resolveConfigPath();
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as CompanyInfo;
}

export function updateCompanyInfo(updates: Partial<CompanyInfo>): CompanyInfo {
  const filePath = resolveConfigPath();
  const current = getCompanyInfo();
  const updated: CompanyInfo = { ...current, ...updates };

  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), "utf8");
  return updated;
}
