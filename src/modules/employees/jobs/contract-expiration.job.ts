import { scheduleDailyAtMidnight } from "../../../shared/jobs/cron.util";
import AppDataSource from "../../../database/data-source";
import { EmployeeJob } from "../../../database/Entities/EmployeeJob";
import { Employee } from "../../../database/Entities/Employee";

export async function checkExpiredContracts(): Promise<void> {
  console.log("[Cron - ContractExpirationJob] Vérification des contrats expirés...");
  
  try {
    await AppDataSource.transaction(async (manager) => {
      // Find all employees whose latest job's endDate is strictly before today (meaning it expired yesterday or before)
      // and who are still active (activeStatus = 0)
      
      const qb = manager.createQueryBuilder(Employee, "emp")
        .innerJoinAndSelect(
          EmployeeJob,
          "ej",
          'ej.id_employee = emp.id_employee AND ej.assignment_date = (SELECT MAX(assignment_date) FROM employees_job WHERE id_employee = emp.id_employee)'
        )
        .where("(emp.active_status = 0 OR emp.active_status IS NULL)")
        .andWhere("ej.end_date < CURRENT_DATE");

      const expiredEmployees = await qb.getMany();

      if (expiredEmployees.length === 0) {
        console.log("[Cron - ContractExpirationJob] Aucun contrat expiré trouvé aujourd'hui.");
        return;
      }

      console.log(`[Cron - ContractExpirationJob] ${expiredEmployees.length} contrat(s) expiré(s) détecté(s). Désactivation en cours...`);

      for (const emp of expiredEmployees) {
        // Deactivate the employee
        await manager.update(Employee, emp.idEmployee, { activeStatus: -1 });
        console.log(`[Cron - ContractExpirationJob] Employé désactivé: ${emp.name} ${emp.lastname} (Code: ${emp.employeeCode})`);
      }
      
      console.log("[Cron - ContractExpirationJob] Désactivation terminée avec succès.");
    });
  } catch (error) {
    console.error("[Cron - ContractExpirationJob] Erreur lors de la désactivation des contrats:", error);
  }
}

// Automatically start the schedule when imported
export function initContractExpirationJob() {
  // Exécuter immédiatement au démarrage pour vérifier les contrats de la veille (ou si le serveur était éteint à minuit)
  checkExpiredContracts();
  
  // Puis programmer l'exécution pour tous les jours à minuit
  scheduleDailyAtMidnight("ContractExpirationJob", checkExpiredContracts);
}
