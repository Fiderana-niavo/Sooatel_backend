import { CrudController } from "../../../../shared/crud/controllers/CrudController";
import { CashJournal } from "../../../../database/Entities/CashJournal";
import { CashJournalDto } from "../type/cash-journal.type";
import { CashJournalService } from "../services/cash-journal.service";

class CashJournalController extends CrudController<CashJournal, CashJournalDto, CashJournalDto> {
  constructor() {
    super(new CashJournalService());
  }
}

export const cashJournalController = new CashJournalController();
