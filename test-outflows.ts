import "reflect-metadata";
import AppDataSource from "./src/database/data-source";
import { CashOutflowService } from "./src/modules/outflows/cash_outflow/services/cash-outflow.service";
import { OutflowCategoryService } from "./src/modules/outflows/category/services/outflow-category.service";
import { CashJournalService } from "./src/modules/outflows/cash_journal/services/cash-journal.service";

async function run() {
  try {
    await AppDataSource.initialize();
    
    const svc1 = new CashOutflowService();
    await svc1.findAll().then(() => console.log("CashOutflow OK"));
    
    const svc2 = new OutflowCategoryService();
    await svc2.findAll().then(() => console.log("OutflowCategory OK"));

    const svc3 = new CashJournalService();
    await svc3.findAll().then((data) => console.log("CashJournal OK, count:", data.records.length));
    
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await AppDataSource.destroy();
  }
}
run();
