import { scheduleDailyAtMidnight } from "../../../shared/jobs/cron.util";
import AppDataSource from "../../../database/data-source";
import { EmployeeJob } from "../../../database/Entities/EmployeeJob";
import { LeaveType } from "../../../database/Entities/LeaveType";
import { EmployeeLeaveBalance } from "../../../database/Entities/EmployeeLeaveBalance";
import { LeaveTransaction } from "../../../database/Entities/LeaveTransaction";
import { getHrSettings } from "../../../shared/utils/hr-settings.utils";

export async function processLeaveAccruals(): Promise<void> {
  console.log("[Cron - LeaveAccrualJob] Vérification des accumulations de congés...");

  try {
    const hrSettings = getHrSettings();
    const accruedDays = hrSettings.DEFAULT_LEAVE_DAYS_PER_MONTH;

    await AppDataSource.transaction(async (manager) => {
      // Find the LeaveType for "Congé annuel"
      const annualLeaveType = await manager.createQueryBuilder(LeaveType, "lt")
        .where("lt.label ILIKE :label", { label: "%Congé annuel%" })
        .getOne();

      if (!annualLeaveType) {
        console.error("[Cron - LeaveAccrualJob] Type de congé 'Congé annuel' introuvable dans la base de données.");
        return;
      }

      const qb = manager.createQueryBuilder(EmployeeJob, "ej")
        .innerJoinAndSelect("ej.employee", "emp")
        .where("EXTRACT(DAY FROM ej.assignment_date) = EXTRACT(DAY FROM CURRENT_DATE)")
        .andWhere("(ej.end_date IS NULL OR ej.end_date > CURRENT_DATE)")
        .andWhere("(emp.active_status = 0 OR emp.active_status IS NULL)");

      const jobsToAccrue = await qb.getMany();

      if (jobsToAccrue.length === 0) {
        console.log("[Cron - LeaveAccrualJob] Aucun employé ne fête son anniversaire de contrat aujourd'hui.");
        return;
      }

      console.log(`[Cron - LeaveAccrualJob] ${jobsToAccrue.length} employé(s) éligible(s) à l'accumulation (${accruedDays} jours).`);

      for (const job of jobsToAccrue) {
        const idEmployee = job.idEmployee;
        const idLeaveType = annualLeaveType.idLeaveType;

        // Find existing balance
        let balance = await manager.findOne(EmployeeLeaveBalance, {
          where: { idEmployee, idLeaveType }
        });

        if (!balance) {
          balance = manager.create(EmployeeLeaveBalance, {
            idEmployee,
            idLeaveType,
            allocatedDays: accruedDays,
            usedDays: 0,
            advanceDays: 0
          });
        } else {
          // TypeORM returns decimal columns as strings from pg, so parse float
          const currentAllocated = parseFloat(balance.allocatedDays as unknown as string) || 0;
          balance.allocatedDays = currentAllocated + accruedDays;
        }

        await manager.save(EmployeeLeaveBalance, balance);

        // Record a transaction
        const transaction = manager.create(LeaveTransaction, {
          transactionType: "ACCRUAL",
          amount: accruedDays,
          createdAt: new Date(),
          idLeaveType,
          idEmployee,
          idLeave: null
        });

        await manager.save(LeaveTransaction, transaction);

        console.log(`[Cron - LeaveAccrualJob] ${accruedDays} jours cumulés pour: ${job.employee.name} ${job.employee.lastname}`);
      }

      console.log("[Cron - LeaveAccrualJob] Accumulation des congés terminée avec succès.");
    });
  } catch (error) {
    console.error("[Cron - LeaveAccrualJob] Erreur lors de l'accumulation des congés:", error);
  }
}

export function initLeaveAccrualJob() {
  scheduleDailyAtMidnight("LeaveAccrualJob", processLeaveAccruals);
}
