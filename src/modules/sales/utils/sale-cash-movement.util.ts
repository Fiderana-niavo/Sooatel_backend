import { QueryRunner, IsNull } from "typeorm";
import { CashMovementCategory } from "../../../database/Entities/CashMovementCategory";
import { CashJournal } from "../../../database/Entities/CashJournal";
import { CashMovement } from "../../../database/Entities/CashMovement";
import { User } from "../../../database/Entities/User";

export async function getOrCreateCategory(queryRunner: QueryRunner, label: string, allowedDirection: number): Promise<CashMovementCategory> {
  let cat = await queryRunner.manager.findOne(CashMovementCategory, { where: { label } });
  if (!cat) {
    cat = new CashMovementCategory();
    cat.label = label;
    cat.allowedDirection = allowedDirection;
    cat = await queryRunner.manager.save(CashMovementCategory, cat);
  }
  return cat;
}

export async function getOpenJournal(queryRunner: QueryRunner): Promise<CashJournal | null> {
  return await queryRunner.manager.findOne(CashJournal, { where: { journalClosing: IsNull() } });
}

export async function resolveEmployeeId(queryRunner: QueryRunner, userId: string): Promise<string> {
  const user = await queryRunner.manager.findOne(User, {
    where: { idUser: userId },
    select: { idEmployee: true }
  });
  if (!user) throw new Error("Utilisateur introuvable pour la création du mouvement de caisse.");
  return user.idEmployee;
}

export async function createCashOutflow(
  queryRunner: QueryRunner,
  amount: number,
  reason: string,
  invoiceReference: string | null,
  idEmployee: string,
  categoryId: string,
  journalId: string,
  paymentMethodId: string
): Promise<CashMovement> {
  const cm = new CashMovement();
  cm.amount = amount;
  cm.movementDate = new Date();
  cm.reason = reason;
  cm.invoiceReference = invoiceReference;
  cm.direction = -5;
  cm.idProcessedBy = idEmployee;
  cm.idJournal = journalId;
  cm.status = 5;
  cm.idCashMovementCategory = categoryId;
  cm.idPaymentMethod = paymentMethodId;
  return await queryRunner.manager.save(CashMovement, cm);
}

export async function createCashInflow(
  queryRunner: QueryRunner,
  amount: number,
  reason: string,
  invoiceReference: string | null,
  idEmployee: string,
  categoryId: string,
  journalId: string,
  paymentMethodId: string
): Promise<CashMovement> {
  const cm = new CashMovement();
  cm.amount = amount;
  cm.movementDate = new Date();
  cm.reason = reason;
  cm.invoiceReference = invoiceReference;
  cm.direction = 5;
  cm.idProcessedBy = idEmployee;
  cm.idJournal = journalId;
  cm.status = 5;
  cm.idCashMovementCategory = categoryId;
  cm.idPaymentMethod = paymentMethodId;
  return await queryRunner.manager.save(CashMovement, cm);
}
