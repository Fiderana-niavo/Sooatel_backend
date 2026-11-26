import "reflect-metadata";
import { Pool, PoolClient } from "pg";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../../.env") });

interface SeedContext {
  malalaUserId: string;
  malalaEmpId: string;
  roles: Record<string, string>; // label -> id_role
  employees: Record<string, string>; // key -> id_employee
  users: Record<string, string>; // username -> id_user
  rooms: Record<string, string>; // room_number -> id_room
  items: Record<string, string>; // label -> id_item
  menuItems: Record<string, string>; // label -> id_menu
  paymentMethods: Record<string, string>; // label -> id_payment_method
}

/**
 * Creates database connection pool
 */
function createPool(): Pool {
  const host = process.env["DB_HOST"] || "localhost";
  const port = Number(process.env["DB_PORT"] || 5433);
  const database = process.env["DB_NAME"] || "sooatel";
  const user = process.env["DB_USER"] || "postgres";
  const password = process.env["DB_PASSWORD"] || "postgres16";
  console.log(`🔌 Connexion DB: host=${host}, port=${port}, db=${database}, user=${user}`);

  return new Pool({
    host,
    port,
    user,
    password,
    database,
  });
}

/**
 * Retrieves existing roles and identifies Malala's user and employee ID
 */
async function getInitialContext(client: PoolClient): Promise<{
  malalaUserId: string;
  malalaEmpId: string;
  roles: Record<string, string>;
}> {
  const rolesRes = await client.query("SELECT id_role, label FROM role");
  const roles: Record<string, string> = {};
  for (const row of rolesRes.rows) {
    roles[row.label] = row.id_role;
  }

  const allUsers = await client.query("SELECT id_user, username, id_employee FROM users");
  for (const u of allUsers.rows) {
    if (u.username.includes("malal")) {
      console.log("Found malala candidate:", u.username, "chars:", [...u.username].map((c: string) => c.charCodeAt(0)));
    }
  }

  let malalaUser = allUsers.rows.find((u: { username: string; id_user: string }) =>
    u.username.trim().toLowerCase().includes("04") ||
    u.username.trim().toLowerCase().includes("malala") ||
    u.id_user === "d39d9390-dc22-4cda-8ea0-242da65e1ada"
  );

  let malalaUserId = "";
  let malalaEmpId = "";

  if (!malalaUser) {
    console.log("Compte administrateur non trouvé, création automatique de Malala (Admin)...");
    const empRes = await client.query(
      `INSERT INTO employees (name, lastname, email_contact, phone_number, address, active_status, base_salary)
       VALUES ('Andrianarivo', 'Malala Niriana', 'malala.andrianarivo@sooatel.mg', '034 07 566 22', 'Lot VT 22 E Manjakaray, Antananarivo', 0, 2500000)
       RETURNING id_employee`
    );
    malalaEmpId = empRes.rows[0].id_employee;
    const pwdHash = await bcrypt.hash("Password123!", 10);
    const userRes = await client.query(
      `INSERT INTO users (username, password_hash, active_status, id_employee)
       VALUES ('malalani04', $1, 0, $2)
       RETURNING id_user`,
      [pwdHash, malalaEmpId]
    );
    malalaUserId = userRes.rows[0].id_user;

    const adminRoleId = roles["Admin"];
    if (adminRoleId) {
      await client.query(
        "INSERT INTO user_role (id_user, id_role) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [malalaUserId, adminRoleId]
      );
    }
  } else {
    malalaUserId = malalaUser.id_user as string;
    malalaEmpId = malalaUser.id_employee as string;
  }

  return { malalaUserId, malalaEmpId, roles };
}

/**
 * Cleans existing data across all business entities while preserving:
 * - permissions, permission_category, role, role_permission
 * - chatbot_chunks
 * - malalni04 user, its employee and user_role
 */
async function cleanExistingData(client: PoolClient, malalaUserId: string, malalaEmpId: string): Promise<void> {
  console.log("🧹 Nettoyage des anciennes données de test...");

  // 1. Audit & logs
  await client.query("DELETE FROM audit_logs WHERE id_user != $1", [malalaUserId]);
  await client.query("DELETE FROM user_tokens");

  // 2. Sales, POS & Invoicing
  await client.query("DELETE FROM sale_items");
  await client.query("DELETE FROM payment");
  await client.query("DELETE FROM sales");
  await client.query("DELETE FROM invoice");
  await client.query("DELETE FROM payment_method_balance");

  // 3. Cash movements & journals
  await client.query("DELETE FROM cash_movement");
  await client.query("DELETE FROM cash_journal");
  await client.query("DELETE FROM cash_movement_category");

  // 4. Stock & Production
  await client.query("DELETE FROM dish_production");
  await client.query("DELETE FROM stock_movement");
  await client.query("DELETE FROM recipe_details");
  await client.query("DELETE FROM recipes");
  await client.query("DELETE FROM menu_items");
  await client.query("DELETE FROM menu_categories");

  // 5. Purchases & Suppliers
  await client.query("DELETE FROM supplier_payment_allocation");
  await client.query("DELETE FROM supplier_payment_line");
  await client.query("DELETE FROM supplier_payment");
  await client.query("DELETE FROM supplier_balance");
  await client.query("DELETE FROM delivery_details");
  await client.query("DELETE FROM purchase_delivery");
  await client.query("DELETE FROM product_delivery");
  await client.query("DELETE FROM purchase_details");
  await client.query("DELETE FROM purchases");
  await client.query("DELETE FROM supplied_items");
  await client.query("DELETE FROM supplier_products_price");
  await client.query("DELETE FROM supplier_products");
  await client.query("DELETE FROM supplier");

  // 6. Items & Catalog
  await client.query("DELETE FROM item_unit");
  await client.query("DELETE FROM product_price");
  await client.query("DELETE FROM items");
  await client.query("DELETE FROM item_type");
  await client.query("DELETE FROM unit_of_measure");
  await client.query("DELETE FROM payment_method");

  // 7. Hotel
  await client.query("DELETE FROM room");
  await client.query("DELETE FROM room_type");
  await client.query("DELETE FROM event");

  // 8. HR: Schedules & Leaves
  await client.query("DELETE FROM schedules");
  await client.query("DELETE FROM employee_availabilities");
  await client.query("DELETE FROM employee_requirements");
  await client.query("DELETE FROM leave_transactions");
  await client.query("DELETE FROM leaves");
  await client.query("DELETE FROM employee_leave_balances");
  await client.query("DELETE FROM leave_types");
  await client.query("DELETE FROM shift_type");

  // 9. HR: Organization & Staff
  await client.query("DELETE FROM employee_team");
  await client.query("DELETE FROM team");
  await client.query("DELETE FROM internship");
  await client.query("DELETE FROM schools");
  await client.query("DELETE FROM employees_job");
  await client.query("DELETE FROM job_titles");
  await client.query("DELETE FROM employment_type");

  // 10. Users & Permissions (keeping malalni04)
  await client.query("DELETE FROM user_permission WHERE id_user != $1", [malalaUserId]);
  await client.query("DELETE FROM user_role WHERE id_user != $1", [malalaUserId]);
  await client.query("DELETE FROM users WHERE id_user != $1", [malalaUserId]);
  await client.query("DELETE FROM employees WHERE id_employee != $1", [malalaEmpId]);

  console.log(" Nettoyage terminé avec succès (malalni04 et sécurité préservés).");
}

/**
 * Seeds HR structures (Jobs, Teams, Employees, Job assignments)
 */
async function seedHR(client: PoolClient, malalaEmpId: string): Promise<Record<string, string>> {
  console.log("👥 Insertion des structures RH et des employés...");

  // Employment Types
  const empTypesData = [
    { label: "CDI", desc: "Contrat à Durée Indéterminée" },
    { label: "CDD", desc: "Contrat à Durée Déterminée" },
    { label: "Stage", desc: "Stage conventionné d'école ou d'université" },
    { label: "Extra / Vacation", desc: "Contrat d'extra et vacation pour événements" },
    { label: "Alternance / Apprentissage", desc: "Formation en alternance hôtelière" },
    { label: "Saisonnier", desc: "Contrat saisonnier pour haute saison" },
  ];
  const empTypes: Record<string, string> = {};
  for (const et of empTypesData) {
    const res = await client.query(
      "INSERT INTO employment_type (label, description) VALUES ($1, $2) RETURNING id_employment_type",
      [et.label, et.desc]
    );
    empTypes[et.label] = res.rows[0].id_employment_type as string;
  }

  const cdiId = empTypes["CDI"] as string;
  const cddId = empTypes["CDD"] as string;
  const stageId = empTypes["Stage"] as string;

  // Job Titles
  const jobsData = [
    "Directeur Général",
    "Directeur d'Exploitation / Manager",
    "Responsable Administratif & Financier",
    "Chef de Cuisine",
    "Second de Cuisine",
    "Chef de Partie",
    "Commis de Cuisine",
    "Plongeur & Aide-Cuisine",
    "Maître d'Hôtel",
    "Chef de Rang / Serveur",
    "Serveuse",
    "Barman / Mixologue",
    "Sommelier",
    "Chef de Réception",
    "Réceptionniste de Jour",
    "Veilleur de Nuit (Night Audit)",
    "Gouvernante Générale",
    "Femme / Valet de Chambre",
    "Responsable Économat & Stocks",
    "Agent de Sécurité & Surveillance",
  ];
  const jobs: Record<string, string> = {};
  for (const j of jobsData) {
    const res = await client.query("INSERT INTO job_titles (title) VALUES ($1) RETURNING id_job_title", [j]);
    jobs[j] = res.rows[0].id_job_title as string;
  }

  // Teams: Exactly 3 teams (Équipe A, Équipe B, Équipe C)
  const teamsData = [
    { name: "Équipe A", desc: "Équipe A - Service de Jour & Direction" },
    { name: "Équipe B", desc: "Équipe B - Service de Soir & Bar" },
    { name: "Équipe C", desc: "Équipe C - Logistique, Exploitation & Cuisine" },
  ];
  const teams: Record<string, string> = {};
  for (const t of teamsData) {
    const res = await client.query(
      "INSERT INTO team (team_name, description) VALUES ($1, $2) RETURNING id_team",
      [t.name, t.desc]
    );
    teams[t.name] = res.rows[0].id_team as string;
  }

  // Update Malala's employee record
  await client.query(
    `UPDATE employees 
     SET name = 'Andrianarivo', lastname = 'Malala Niriana', email_contact = 'malala.andrianarivo@sooatel.mg', 
         phone_number = '034 07 566 22', address = 'Lot VT 22 E Manjakaray, Antananarivo', active_status = 0, base_salary = 2500000
     WHERE id_employee = $1`,
    [malalaEmpId]
  );

  // Logical employees distributed across the 3 teams with distinct job titles per team:
  // Équipe A: Directeur Général (Malala), Chef de Cuisine (Rakoto), Chef de Rang / Serveur (Razafy), Réceptionniste de Jour (Ramanana), Agent de Sécurité & Surveillance (Tsiresy)
  // Équipe B: Second de Cuisine (Rajaona), Serveuse (Rasoa), Barman / Mixologue (Randria), Veilleur de Nuit (Andrianaivo)
  // Équipe C: Directeur d'Exploitation / Manager (Rabe), Responsable Économat & Stocks (Ratsimba), Commis de Cuisine (Andry), Plongeur & Aide-Cuisine (Koto - stagiaire non confirmé)
  const staff = [
    // Équipe A
    {
      key: "chef",
      name: "Rakoto",
      lastname: "Faly",
      email: "faly.rakoto@sooatel.mg",
      phone: "034 22 345 67",
      addr: "Lot IV C 88 Isotry, Antananarivo",
      salary: 1500000,
      job: "Chef de Cuisine",
      team: "Équipe A",
      contract: cdiId,
      confirmed: true,
    },
    {
      key: "serveur",
      name: "Razafy",
      lastname: "Soa",
      email: "soa.razafy@sooatel.mg",
      phone: "034 44 567 89",
      addr: "Lot I M 45 Ambanidia, Antananarivo",
      salary: 800000,
      job: "Chef de Rang / Serveur",
      team: "Équipe A",
      contract: cdiId,
      confirmed: false, // Non encore confirmé
    },
    {
      key: "reception",
      name: "Ramanana",
      lastname: "Haingo",
      email: "haingo.ramanana@sooatel.mg",
      phone: "034 66 789 01",
      addr: "Lot IV G 10 Ampandrana, Antananarivo",
      salary: 900000,
      job: "Réceptionniste de Jour",
      team: "Équipe A",
      contract: cdiId,
      confirmed: true,
    },
    {
      key: "securite",
      name: "Tsiresy",
      lastname: "Marc",
      email: "marc.tsiresy@sooatel.mg",
      phone: "034 88 123 45",
      addr: "Lot II M 15 Ankadimbahoaka, Antananarivo",
      salary: 780000,
      job: "Agent de Sécurité & Surveillance",
      team: "Équipe A",
      contract: cdiId,
      confirmed: true,
    },

    // Équipe B
    {
      key: "second",
      name: "Rajaona",
      lastname: "Rivo",
      email: "rivo.rajaona@sooatel.mg",
      phone: "034 12 345 67",
      addr: "Lot II W 40 Ambohimanarina, Antananarivo",
      salary: 1100000,
      job: "Second de Cuisine",
      team: "Équipe B",
      contract: cdiId,
      confirmed: true,
    },
    {
      key: "serveuse2",
      name: "Rasoa",
      lastname: "Hanta",
      email: "hanta.rasoa@sooatel.mg",
      phone: "034 23 456 78",
      addr: "Lot IV T 18 67Ha, Antananarivo",
      salary: 780000,
      job: "Serveuse",
      team: "Équipe B",
      contract: cddId,
      confirmed: true,
    },
    {
      key: "barman",
      name: "Randria",
      lastname: "Niavo",
      email: "niavo.randria@sooatel.mg",
      phone: "034 55 678 90",
      addr: "Lot II K 22 Mahamasina, Antananarivo",
      salary: 850000,
      job: "Barman / Mixologue",
      team: "Équipe B",
      contract: cdiId,
      confirmed: true,
    },
    {
      key: "nightaudit",
      name: "Andrianaivo",
      lastname: "Lova",
      email: "lova.andrianaivo@sooatel.mg",
      phone: "034 34 567 89",
      addr: "Lot I B 22 Andravoahangy, Antananarivo",
      salary: 850000,
      job: "Veilleur de Nuit (Night Audit)",
      team: "Équipe B",
      contract: cdiId,
      confirmed: true,
    },

    // Équipe C
    {
      key: "manager",
      name: "Rabe",
      lastname: "Jean",
      email: "jean.rabe@sooatel.mg",
      phone: "034 11 234 56",
      addr: "Lot II B 14 Ankadifotsy, Antananarivo",
      salary: 1800000,
      job: "Directeur d'Exploitation / Manager",
      team: "Équipe C",
      contract: cdiId,
      confirmed: true,
    },
    {
      key: "economat",
      name: "Ratsimba",
      lastname: "Alain",
      email: "alain.ratsimba@sooatel.mg",
      phone: "034 45 678 90",
      addr: "Lot III F 33 Ankorondrano, Antananarivo",
      salary: 1000000,
      job: "Responsable Économat & Stocks",
      team: "Équipe C",
      contract: cdiId,
      confirmed: true,
    },
    {
      key: "commis",
      name: "Andry",
      lastname: "Toavina",
      email: "toavina.andry@sooatel.mg",
      phone: "034 33 456 78",
      addr: "Lot III A 12 Tanjombato, Antananarivo",
      salary: 750000,
      job: "Commis de Cuisine",
      team: "Équipe C",
      contract: cddId,
      confirmed: true,
    },
    {
      key: "stagiaire",
      name: "Koto",
      lastname: "Hery",
      email: "hery.koto@sooatel.mg",
      phone: "034 77 890 12",
      addr: "Lot V A 05 Ankatso, Antananarivo",
      salary: 350000,
      job: "Plongeur & Aide-Cuisine",
      team: "Équipe C",
      contract: stageId,
      confirmed: false, // Non encore confirmé
    },
  ];

  const employeesMap: Record<string, string> = { malala: malalaEmpId };

  // Assign job and team to Malala (in Équipe A)
  await client.query(
    `INSERT INTO employees_job (id_employee, id_job_title, id_employment_type, status, base_salary, assignment_date, confirmed_date)
     VALUES ($1, $2, $3, 0, 2500000, '2024-01-01', '2024-01-01')`,
    [malalaEmpId, jobs["Directeur Général"], cdiId]
  );
  await client.query("INSERT INTO employee_team (id_employee, id_team) VALUES ($1, $2)", [
    malalaEmpId,
    teams["Équipe A"],
  ]);

  // Insert other employees
  for (const s of staff) {
    const empRes = await client.query(
      `INSERT INTO employees (name, lastname, email_contact, phone_number, address, active_status, base_salary)
       VALUES ($1, $2, $3, $4, $5, 0, $6) RETURNING id_employee`,
      [s.name, s.lastname, s.email, s.phone, s.addr, s.salary]
    );
    const empId = empRes.rows[0].id_employee as string;
    employeesMap[s.key] = empId;

    const statusVal = s.confirmed ? 0 : 5;
    const confirmVal = s.confirmed ? "2025-01-01" : null;

    await client.query(
      `INSERT INTO employees_job (id_employee, id_job_title, id_employment_type, status, base_salary, assignment_date, confirmed_date)
       VALUES ($1, $2, $3, $4, $5, '2025-01-01', $6)`,
      [empId, jobs[s.job], s.contract, statusVal, s.salary, confirmVal]
    );

    await client.query("INSERT INTO employee_team (id_employee, id_team) VALUES ($1, $2)", [
      empId,
      teams[s.team],
    ]);
  }

  // School & Internship for stagiaire
  const schoolsData = [
    "Institut National du Tourisme et de l'Hôtellerie (INTH)",
    "Université d'Antananarivo (Ankatso)",
    "Institut Supérieur de la Communication, des Affaires et du Management (ISCAM)",
    "Institut National des Sciences Comptables et de l'Administration d'Entreprises (INSCAE)",
    "Centre de Formation Professionnelle Hôtelière (CFPH)",
  ];
  let inthSchoolId = "";
  for (const sc of schoolsData) {
    const res = await client.query("INSERT INTO schools (name) VALUES ($1) RETURNING id_school", [sc]);
    if (sc.includes("INTH")) {
      inthSchoolId = res.rows[0].id_school as string;
    }
  }

  await client.query(
    `INSERT INTO internship (id_employee, id_school, academic_supervisor_name, professionnal_supervisor_name)
     VALUES ($1, $2, 'Prof. Rakotondrabe', 'Rakoto Faly')`,
    [employeesMap["stagiaire"], inthSchoolId]
  );

  return employeesMap;
}

/**
 * Seeds logical users with known password for easy testing
 */
async function seedUsers(
  client: PoolClient,
  malalaUserId: string,
  employeesMap: Record<string, string>,
  rolesMap: Record<string, string>
): Promise<Record<string, string>> {
  console.log("🔐 Configuration des comptes utilisateurs de test...");

  // Standard password for test users
  const standardPasswordHash = await bcrypt.hash("Password123!", 10);

  // Clean trailing spaces on malalani04 username if needed
  await client.query("UPDATE users SET username = 'malalani04', active_status = 1 WHERE id_user = $1", [
    malalaUserId,
  ]);

  // Ensure Admin role on Malala
  const adminRoleId = rolesMap["Admin"];
  if (adminRoleId) {
    const hasAdmin = await client.query(
      "SELECT 1 FROM user_role WHERE id_user = $1 AND id_role = $2",
      [malalaUserId, adminRoleId]
    );
    if (hasAdmin.rows.length === 0) {
      await client.query("INSERT INTO user_role (id_user, id_role) VALUES ($1, $2)", [
        malalaUserId,
        adminRoleId,
      ]);
    }
  }

  const usersMap: Record<string, string> = { malalani04: malalaUserId, malalni04: malalaUserId };

  const testUsersConfig = [
    {
      username: "manager.test",
      empKey: "manager",
      role: rolesMap["Manager"] || adminRoleId,
    },
    {
      username: "chef.test",
      empKey: "chef",
      role: rolesMap["Chef cuisinier"] || rolesMap["default"],
    },
    {
      username: "serveur.test",
      empKey: "serveur",
      role: rolesMap["Caissier"] || rolesMap["default"],
    },
    {
      username: "reception.test",
      empKey: "reception",
      role: rolesMap["default"] || adminRoleId,
    },
    {
      username: "barman.test",
      empKey: "barman",
      role: rolesMap["default"] || adminRoleId,
    },
    {
      username: "securite.test",
      empKey: "securite",
      role: rolesMap["default"] || adminRoleId,
    },
    {
      username: "stagiaire.test",
      empKey: "stagiaire",
      role: rolesMap["default"] || adminRoleId,
    },
  ];

  for (const cfg of testUsersConfig) {
    const res = await client.query(
      `INSERT INTO users (username, password_hash, active_status, created_date, id_employee)
       VALUES ($1, $2, 1, NOW(), $3) RETURNING id_user`,
      [cfg.username, standardPasswordHash, employeesMap[cfg.empKey]]
    );
    const uId = res.rows[0].id_user as string;
    usersMap[cfg.username] = uId;

    if (cfg.role) {
      await client.query("INSERT INTO user_role (id_user, id_role) VALUES ($1, $2)", [uId, cfg.role]);
    }
  }

  return usersMap;
}

/**
 * Seeds Shift types & weekly planning (Schedules) and employee staffing requirements
 */
async function seedShiftsAndSchedules(
  client: PoolClient,
  employeesMap: Record<string, string>
): Promise<void> {
  console.log("⏰ Insertion des shifts, besoins en personnel et planning de la semaine...");

  const shiftsData = [
    {
      label: "Shift 24h",
      start: "08:00:00",
      end: "08:00:00",
      desc: "Garde continue 24 heures / Astreinte, sécurité et permanence technique",
    },
    { label: "Shift Matin", start: "06:00:00", end: "14:30:00", desc: "Service petit-déjeuner et préparation du midi" },
    { label: "Shift Continu Jour", start: "08:00:00", end: "16:30:00", desc: "Administration, économat, stocks et maintenance" },
    { label: "Shift Après-midi", start: "12:00:00", end: "20:30:00", desc: "Renfort déjeuner et préparation du dîner" },
    { label: "Shift Soir", start: "14:00:00", end: "22:30:00", desc: "Service dîner, bar et fermeture restaurant" },
    { label: "Shift Coupure", start: "10:00:00", end: "22:30:00", desc: "Coupure service midi (10h-14h30) et soir (18h30-22h30)" },
    { label: "Shift Nuit", start: "22:00:00", end: "06:30:00", desc: "Permanence nocturne hôtel, sécurité et night audit" },
  ];
  const shiftsMap: Record<string, string> = {};
  for (const sh of shiftsData) {
    const res = await client.query(
      `INSERT INTO shift_type (label, custom_start_time, custom_end_time, start_time, end_time, description)
       VALUES ($1, $2, $3, $2, $3, $4) RETURNING id_shift_type`,
      [sh.label, sh.start, sh.end, sh.desc]
    );
    shiftsMap[sh.label] = res.rows[0].id_shift_type as string;
  }

  const shift24Id = shiftsMap["Shift 24h"] as string;
  const matinId = shiftsMap["Shift Matin"] as string;
  const soirId = shiftsMap["Shift Soir"] as string;
  const nuitId = shiftsMap["Shift Nuit"] as string;
  const jourId = shiftsMap["Shift Continu Jour"] as string;

  // Retrieve Job Titles IDs
  const jobsRes = await client.query("SELECT id_job_title, title FROM job_titles");
  const jobMap: Record<string, string> = {};
  for (const row of jobsRes.rows) {
    jobMap[row.title] = row.id_job_title as string;
  }

  // Populate employee requirements (Besoin en employé)
  console.log("👥 Insertion des besoins en personnel (employee_requirements)...");

  // 1. Shift 24h requirements:
  // - Agent de Sécurité & Surveillance: 1 person required every day (0..6)
  const securiteJobId = jobMap["Agent de Sécurité & Surveillance"];
  if (securiteJobId) {
    for (let day = 0; day <= 6; day++) {
      await client.query(
        `INSERT INTO employee_requirements (day_of_week, required_count, id_shift_type, id_job_title)
         VALUES ($1, $2, $3, $4)`,
        [day, 1, shift24Id, securiteJobId]
      );
    }
  }

  // - Veilleur de Nuit (Night Audit) on Shift 24h for weekend coverage (Vendredi: 5, Samedi: 6, Dimanche: 0)
  const nightJobId = jobMap["Veilleur de Nuit (Night Audit)"];
  if (nightJobId) {
    for (const day of [0, 5, 6]) {
      await client.query(
        `INSERT INTO employee_requirements (day_of_week, required_count, id_shift_type, id_job_title)
         VALUES ($1, $2, $3, $4)`,
        [day, 1, shift24Id, nightJobId]
      );
    }
  }

  // 2. Shift Matin requirements:
  const chefJobId = jobMap["Chef de Cuisine"];
  const commisJobId = jobMap["Commis de Cuisine"];
  const recepJobId = jobMap["Réceptionniste de Jour"];
  for (let day = 1; day <= 6; day++) {
    if (chefJobId) {
      await client.query(
        `INSERT INTO employee_requirements (day_of_week, required_count, id_shift_type, id_job_title)
         VALUES ($1, $2, $3, $4)`,
        [day, 1, matinId, chefJobId]
      );
    }
    if (commisJobId) {
      await client.query(
        `INSERT INTO employee_requirements (day_of_week, required_count, id_shift_type, id_job_title)
         VALUES ($1, $2, $3, $4)`,
        [day, 1, matinId, commisJobId]
      );
    }
  }

  // 3. Shift Soir requirements:
  const serveurJobId = jobMap["Chef de Rang / Serveur"];
  const barmanJobId = jobMap["Barman / Mixologue"];
  const secondJobId = jobMap["Second de Cuisine"];
  for (const day of [0, 2, 3, 4, 5, 6]) {
    if (serveurJobId) {
      await client.query(
        `INSERT INTO employee_requirements (day_of_week, required_count, id_shift_type, id_job_title)
         VALUES ($1, $2, $3, $4)`,
        [day, 2, soirId, serveurJobId]
      );
    }
    if (barmanJobId) {
      await client.query(
        `INSERT INTO employee_requirements (day_of_week, required_count, id_shift_type, id_job_title)
         VALUES ($1, $2, $3, $4)`,
        [day, 1, soirId, barmanJobId]
      );
    }
    if (secondJobId) {
      await client.query(
        `INSERT INTO employee_requirements (day_of_week, required_count, id_shift_type, id_job_title)
         VALUES ($1, $2, $3, $4)`,
        [day, 1, soirId, secondJobId]
      );
    }
  }

  // 4. Shift Continu Jour requirements:
  if (recepJobId) {
    for (let day = 1; day <= 5; day++) {
      await client.query(
        `INSERT INTO employee_requirements (day_of_week, required_count, id_shift_type, id_job_title)
         VALUES ($1, $2, $3, $4)`,
        [day, 1, jourId, recepJobId]
      );
    }
  }

  // Generate 7 days schedule for current week
  const today = new Date();
  for (let i = -3; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const dateStr = yyyy + "-" + mm + "-" + dd;

    // Chef & Commis in the morning
    await client.query(
      "INSERT INTO schedules (id_employee, id_shift_type, schedule_date) VALUES ($1, $2, $3)",
      [employeesMap["chef"], matinId, dateStr]
    );
    await client.query(
      "INSERT INTO schedules (id_employee, id_shift_type, schedule_date) VALUES ($1, $2, $3)",
      [employeesMap["commis"], matinId, dateStr]
    );

    // Serveur & Barman in the evening
    await client.query(
      "INSERT INTO schedules (id_employee, id_shift_type, schedule_date) VALUES ($1, $2, $3)",
      [employeesMap["serveur"], soirId, dateStr]
    );
    await client.query(
      "INSERT INTO schedules (id_employee, id_shift_type, schedule_date) VALUES ($1, $2, $3)",
      [employeesMap["barman"], soirId, dateStr]
    );

    // Manager on day duty, Receptionist in rotation
    await client.query(
      "INSERT INTO schedules (id_employee, id_shift_type, schedule_date) VALUES ($1, $2, $3)",
      [employeesMap["manager"], jourId, dateStr]
    );
    await client.query(
      "INSERT INTO schedules (id_employee, id_shift_type, schedule_date) VALUES ($1, $2, $3)",
      [employeesMap["reception"], i % 2 === 0 ? soirId : nuitId, dateStr]
    );

    // Security Agent on Shift 24h
    if (employeesMap["securite"]) {
      await client.query(
        "INSERT INTO schedules (id_employee, id_shift_type, schedule_date) VALUES ($1, $2, $3)",
        [employeesMap["securite"], shift24Id, dateStr]
      );
    }

    // Night Audit on Shift Nuit
    if (employeesMap["nightaudit"]) {
      await client.query(
        "INSERT INTO schedules (id_employee, id_shift_type, schedule_date) VALUES ($1, $2, $3)",
        [employeesMap["nightaudit"], nuitId, dateStr]
      );
    }
  }
}

/**
 * Seeds Leave types, leave balances, and leave records
 */
async function seedLeaves(client: PoolClient, employeesMap: Record<string, string>): Promise<void> {
  console.log("🏖️ Insertion des congés et des soldes...");

  const leaveTypesData = [
    { label: "Congé Payé", paid: true, proof: false, mode: "ALWAYS", cap: 25, period: "ANNUAL" },
    { label: "Congé Maladie", paid: true, proof: true, mode: "ALWAYS", cap: 15, period: "ANNUAL" },
    { label: "Congé Maternité / Paternité", paid: true, proof: true, mode: "NEVER", cap: 90, period: "LIFETIME" },
    { label: "Congé Événement Familial / Exceptionnel", paid: true, proof: true, mode: "NEVER", cap: 5, period: "ANNUAL" },
    { label: "Congé Sans Solde", paid: false, proof: false, mode: "ALWAYS", cap: 30, period: "ANNUAL" },
    { label: "Récupération d'Heures Supplémentaires", paid: true, proof: false, mode: "OPTIONAL", cap: 10, period: "ANNUAL" },
  ];
  const leaveTypesMap: Record<string, string> = {};
  for (const lt of leaveTypesData) {
    const res = await client.query(
      `INSERT INTO leave_types (label, is_paid, requires_proof, deduction_mode, cap, cap_period)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_leave_type`,
      [lt.label, lt.paid, lt.proof, lt.mode, lt.cap, lt.period]
    );
    leaveTypesMap[lt.label] = res.rows[0].id_leave_type as string;
  }

  const cpId = leaveTypesMap["Congé Payé"] as string;
  const cmId = leaveTypesMap["Congé Maladie"] as string;
  const stagiaireEmpId = employeesMap["stagiaire"];
  const serveurEmpId = employeesMap["serveur"];

  // Initialize balances for each employee across leave types
  for (const [key, empId] of Object.entries(employeesMap)) {
    for (const [typeLabel, ltId] of Object.entries(leaveTypesMap)) {
      let allocated = 0;
      let used = 0;
      let advance = 0;

      if (typeLabel === "Congé Payé") {
        if (key === "stagiaire") {
          allocated = 0;
          used = 0;
          advance = 4; // Unconfirmed stagiaire with 4 days in advance
        } else if (key === "serveur") {
          // Pour Razafy Soa: efface les congés payés, garde juste la dette de 5 jours
          allocated = 0;
          used = 0;
          advance = 5;
        } else {
          allocated = 25;
          used = 4;
          advance = 0;
        }
      } else if (typeLabel === "Congé Maladie") {
        allocated = (key === "stagiaire" || key === "serveur") ? 0 : 15;
      }

      await client.query(
        `INSERT INTO employee_leave_balances (id_employee, id_leave_type, allocated_days, used_days, advance_days)
         VALUES ($1, $2, $3, $4, $5)`,
        [empId, ltId, allocated, used, advance]
      );
    }
  }

  // 1. Confirmed employee: Barman (past validated leave)
  const barmanLeaveRes = await client.query(
    `INSERT INTO leaves (start_date, end_date, leave_unit, id_employee, id_leave_type, status)
     VALUES ('2026-10-10 08:00:00+03', '2026-10-14 17:00:00+03', 'DAYS', $1, $2, 0)
     RETURNING id_leave`,
    [employeesMap["barman"], cpId]
  );
  await client.query(
    `INSERT INTO leave_transactions (transaction_type, amount, created_at, id_leave, id_leave_type, id_employee)
     VALUES ('UTILISATION', 5, '2026-10-09 14:00:00+03', $1, $2, $3)`,
    [barmanLeaveRes.rows[0].id_leave, cpId, employeesMap["barman"]]
  );

  // 2. Razafy Soa (Serveur): Congé en avance (dette de 5 jours uniquement)
  const soaLeaveRes = await client.query(
    `INSERT INTO leaves (start_date, end_date, leave_unit, id_employee, id_leave_type, status)
     VALUES ('2026-12-01 08:00:00+03', '2026-12-05 17:00:00+03', 'DAYS', $1, $2, 5)
     RETURNING id_leave`,
    [serveurEmpId, cpId]
  );
  // Uniquement la transaction de dette/avance de 5 jours
  await client.query(
    `INSERT INTO leave_transactions (transaction_type, amount, created_at, id_leave, id_leave_type, id_employee)
     VALUES ('AVANCE', 5, '2026-11-15 09:00:00+03', $1, $2, $3)`,
    [soaLeaveRes.rows[0].id_leave, cpId, serveurEmpId]
  );

  // 3. Stagiaire (Koto Hery): Employé non confirmé avec congés en avance
  const pastAdvRes = await client.query(
    `INSERT INTO leaves (start_date, end_date, leave_unit, id_employee, id_leave_type, status)
     VALUES ('2026-10-20 08:00:00+03', '2026-10-21 17:00:00+03', 'DAYS', $1, $2, 0)
     RETURNING id_leave`,
    [stagiaireEmpId, cpId]
  );
  await client.query(
    `INSERT INTO leave_transactions (transaction_type, amount, created_at, id_leave, id_leave_type, id_employee)
     VALUES ('AVANCE', 2, '2026-10-18 10:00:00+03', $1, $2, $3)`,
    [pastAdvRes.rows[0].id_leave, cpId, stagiaireEmpId]
  );

  const pendingAdvRes = await client.query(
    `INSERT INTO leaves (start_date, end_date, leave_unit, id_employee, id_leave_type, status)
     VALUES ('2026-11-25 08:00:00+03', '2026-11-26 17:00:00+03', 'DAYS', $1, $2, 5)
     RETURNING id_leave`,
    [stagiaireEmpId, cpId]
  );
  await client.query(
    `INSERT INTO leave_transactions (transaction_type, amount, created_at, id_leave, id_leave_type, id_employee)
     VALUES ('AVANCE', 2, '2026-11-15 09:00:00+03', $1, $2, $3)`,
    [pendingAdvRes.rows[0].id_leave, cpId, stagiaireEmpId]
  );
}

/**
 * Seeds Hotel Room Types and Rooms
 */
async function seedHotel(client: PoolClient): Promise<Record<string, string>> {
  console.log("🏨 Insertion des chambres et des types d'hébergement...");

  const roomTypesData = [
    { label: "Chambre Standard Simple", desc: "1 personne, lit simple, climatisation, salle d'eau, WiFi" },
    { label: "Chambre Standard Double", desc: "2 personnes, lit Queen size, salle de bain privée, climatisation, WiFi" },
    { label: "Chambre Supérieure Twin", desc: "2 personnes, 2 lits simples, balcon vue jardin, minibar, TV écran plat" },
    { label: "Chambre Supérieure King", desc: "2 personnes, lit King size, balcon vue jardin, salon, coffre-fort" },
    { label: "Suite Junior", desc: "2 à 3 personnes, grand lit, coin salon spacieux, plateau de courtoisie" },
    { label: "Suite Deluxe Familiale", desc: "4 personnes, 2 chambres, terrasse panoramique, baignoire balnéo" },
    { label: "Bungalow Charme Jardin", desc: "Bungalow individuel indépendant au calme dans le jardin tropical" },
  ];
  const roomTypesMap: Record<string, string> = {};
  for (const rt of roomTypesData) {
    const res = await client.query(
      "INSERT INTO room_type (label, description) VALUES ($1, $2) RETURNING id_room_type",
      [rt.label, rt.desc]
    );
    roomTypesMap[rt.label] = res.rows[0].id_room_type as string;
  }

  const stdId = roomTypesMap["Chambre Standard Double"] as string;
  const supId = roomTypesMap["Chambre Supérieure King"] as string;
  const suiteId = roomTypesMap["Suite Deluxe Familiale"] as string;

  const roomsData = [
    { num: "CH-101", type: stdId, desc: "RDC - Standard Vue Patio" },
    { num: "CH-102", type: stdId, desc: "RDC - Standard Côté Cour" },
    { num: "CH-103", type: stdId, desc: "RDC - Standard Accès PMR" },
    { num: "CH-201", type: supId, desc: "1er étage - Supérieure Balcon Jardin" },
    { num: "CH-202", type: supId, desc: "1er étage - Supérieure Balcon Piscine" },
    { num: "CH-301", type: suiteId, desc: "2e étage - Suite Deluxe Vue Panoramique" },
  ];

  const roomsMap: Record<string, string> = {};
  for (const r of roomsData) {
    const res = await client.query(
      "INSERT INTO room (room_number, id_room_type, description) VALUES ($1, $2, $3) RETURNING id_room",
      [r.num, r.type, r.desc]
    );
    roomsMap[r.num] = res.rows[0].id_room as string;
  }

  return roomsMap;
}

/**
 * Seeds Hotel/Restaurant Events and Special Seasons
 */
async function seedEvents(client: PoolClient): Promise<void> {
  console.log("🎉 Insertion des saisons et événements spéciaux...");

  const eventsData = [
    {
      name: "Haute Saison Touristique 2026",
      start: "2026-06-01",
      end: "2026-10-31",
    },
    {
      name: "Fête Nationale de l'Indépendance (26 Juin)",
      start: "2026-06-24",
      end: "2026-06-27",
    },
    {
      name: "Saint-Valentin & Soirée Romantique",
      start: "2027-02-14",
      end: "2027-02-15",
    },
    {
      name: "Fêtes de Fin d'Année (Noël & Réveillon)",
      start: "2026-12-20",
      end: "2027-01-05",
    },
    {
      name: "Basse Saison & Travaux de Maintenance",
      start: "2027-01-15",
      end: "2027-03-31",
    },
  ];

  for (const ev of eventsData) {
    await client.query(
      "INSERT INTO event (event_name, start_date, end_date) VALUES ($1, $2, $3)",
      [ev.name, ev.start, ev.end]
    );
  }
}

/**
 * Seeds Units, Item Types, Items (Raw materials, Ingredients, Beverages)
 */
async function seedInventory(client: PoolClient): Promise<Record<string, string>> {
  console.log("📦 Insertion de l'inventaire, unités et matières premières...");

  // Units
  const unitsData = [
    { label: "Kilogramme", symbol: "kg" },
    { label: "Gramme", symbol: "g" },
    { label: "Milligramme", symbol: "mg" },
    { label: "Litre", symbol: "L" },
    { label: "Décilitre", symbol: "dl" },
    { label: "Centilitre", symbol: "cl" },
    { label: "Millilitre", symbol: "ml" },
    { label: "Pièce", symbol: "pc" },
    { label: "Portion", symbol: "portion" },
    { label: "Bouteille", symbol: "btl" },
    { label: "Canette", symbol: "can" },
    { label: "Boîte / Conserve", symbol: "bte" },
    { label: "Paquet / Sachet", symbol: "paq" },
    { label: "Carton", symbol: "ctn" },
    { label: "Botte", symbol: "botte" },
  ];
  const units: Record<string, string> = {};
  for (const u of unitsData) {
    const res = await client.query(
      "INSERT INTO unit_of_measure (label, symbol) VALUES ($1, $2) RETURNING id_unit",
      [u.label, u.symbol]
    );
    units[u.symbol] = res.rows[0].id_unit as string;
  }

  // Item Types
  const typesData = [
    { label: "Matière première", desc: "Denrées et ingrédients bruts à transformer" },
    { label: "Ingrédient", desc: "Produit préparé ou semi-fini pour la cuisine" },
    { label: "Épicerie sèche & Condiments", desc: "Riz, pâtes, farine, sucre, épices, huiles" },
    { label: "Fruits & Légumes frais", desc: "Primeurs, légumes maraîchers locaux" },
    { label: "Boucherie & Volailles", desc: "Viandes fraîches de zébu, porc, volailles" },
    { label: "Poissonnerie & Fruits de mer", desc: "Poissons frais, crevettes, fruits de mer" },
    { label: "Produits laitiers & Fromages", desc: "Beurre, fromages, laits, crèmes fraîches" },
    { label: "Boisson", desc: "Boissons en bouteilles et canettes pour revente" },
    { label: "Boisson non alcoolisée", desc: "Jus de fruits naturels, eaux minérales, sodas" },
    { label: "Boisson alcoolisée & Vins", desc: "Bières, vins d'Alsace, spiritueux, champagnes" },
    { label: "Boisson chaude", desc: "Cafés grands crus, thés, infusions" },
    { label: "Consommable", desc: "Fournitures et emballages" },
    { label: "Produits d'hygiène & Entretien", desc: "Lessives, désinfectants, produits de nettoyage" },
    { label: "Plat cuisiné & Production", desc: "Plats et préparations culinaires réalisés sur place" },
  ];
  const types: Record<string, string> = {};
  for (const t of typesData) {
    const res = await client.query(
      "INSERT INTO item_type (label, description) VALUES ($1, $2) RETURNING id_product_type",
      [t.label, t.desc]
    );
    types[t.label] = res.rows[0].id_product_type as string;
  }

  // Items
  const itemsData = [
    // Viandes & Volailles
    {
      label: "Filet de zébu frais",
      unit: "kg",
      type: "Matière première",
      qty: 25,
      min: 8,
      cost: 22000,
      perish: true,
      desc: "Viande de zébu de première qualité issue d'élevages locaux",
    },
    {
      label: "Poulet fermier découpé",
      unit: "kg",
      type: "Matière première",
      qty: 20,
      min: 6,
      cost: 16000,
      perish: true,
      desc: "Poulet fermier prêt à cuisiner",
    },
    // Légumes & Épicerie
    {
      label: "Riz blanc de Madagascar",
      unit: "kg",
      type: "Matière première",
      qty: 120,
      min: 30,
      cost: 2400,
      perish: false,
      desc: "Riz Makalioka de luxe (sac de 50kg à 120 000 Ar)",
    },
    {
      label: "Pommes de terre fraîches",
      unit: "kg",
      type: "Matière première",
      qty: 60,
      min: 15,
      cost: 2500,
      perish: true,
      desc: "Pommes de terre d'Ankaratra pour frites et purées",
    },
    {
      label: "Tomates fraîches",
      unit: "kg",
      type: "Matière première",
      qty: 18,
      min: 5,
      cost: 3500,
      perish: true,
      desc: "Tomates mûres pour sauces et salades",
    },
    {
      label: "Oignons rouges",
      unit: "kg",
      type: "Matière première",
      qty: 25,
      min: 5,
      cost: 3000,
      perish: false,
      desc: "Oignons locaux pour assaisonnements",
    },
    {
      label: "Ail frais",
      unit: "kg",
      type: "Matière première",
      qty: 8,
      min: 2,
      cost: 8000,
      perish: false,
      desc: "Ail blanc frais",
    },
    {
      label: "Brèdes mafana",
      unit: "kg",
      type: "Matière première",
      qty: 12,
      min: 3,
      cost: 2000,
      perish: true,
      desc: "Brèdes fraîches pour Romazava traditionnel",
    },
    {
      label: "Huile végétale de tournesol",
      unit: "L",
      type: "Matière première",
      qty: 40,
      min: 10,
      cost: 8500,
      perish: false,
      desc: "Huile de friture et cuisson",
    },
    {
      label: "Beurre demi-sel",
      unit: "kg",
      type: "Matière première",
      qty: 10,
      min: 3,
      cost: 28000,
      perish: true,
      desc: "Beurre pasteurisé pour cuisine et sauces",
    },
    {
      label: "Crème fraîche liquide",
      unit: "L",
      type: "Matière première",
      qty: 15,
      min: 4,
      cost: 14000,
      perish: true,
      desc: "Crème culinaire 30% MG",
    },
    {
      label: "Mozzarella râpée",
      unit: "kg",
      type: "Matière première",
      qty: 16,
      min: 5,
      cost: 32000,
      perish: true,
      desc: "Fromage mozzarella pour pizzas",
    },
    {
      label: "Farine de blé T55",
      unit: "kg",
      type: "Matière première",
      qty: 50,
      min: 15,
      cost: 4000,
      perish: false,
      desc: "Farine pâtissière et pâte à pizza",
    },
    {
      label: "Sauce tomate spéciale pizza",
      unit: "kg",
      type: "Matière première",
      qty: 20,
      min: 5,
      cost: 9000,
      perish: false,
      desc: "Coulis de tomate assaisonné à l'origan",
    },
    {
      label: "Poivre vert en saumure",
      unit: "kg",
      type: "Matière première",
      qty: 5,
      min: 1,
      cost: 25000,
      perish: false,
      desc: "Poivre vert de Madagascar pour sauce steak",
    },
    {
      label: "Café d'Arabica moulu",
      unit: "kg",
      type: "Matière première",
      qty: 10,
      min: 2,
      cost: 28000,
      perish: false,
      desc: "Café pur arabica des hauts plateaux",
    },
    // Boissons
    {
      label: "Bière THB Pilsener 65cl",
      unit: "btl",
      type: "Boisson",
      qty: 144,
      min: 36,
      cost: 3600,
      perish: false,
      desc: "Three Horses Beer bouteille verre 65cl",
    },
    {
      label: "Coca-Cola 33cl",
      unit: "btl",
      type: "Boisson",
      qty: 96,
      min: 24,
      cost: 2200,
      perish: false,
      desc: "Coca-Cola verre consigné 33cl",
    },
    {
      label: "Eau Vive 1.5L",
      unit: "btl",
      type: "Boisson",
      qty: 180,
      min: 36,
      cost: 1400,
      perish: false,
      desc: "Eau minérale naturelle Eau Vive 1.5L",
    },
    {
      label: "Jus naturel de mangue/passion 1L",
      unit: "L",
      type: "Boisson",
      qty: 25,
      min: 6,
      cost: 5000,
      perish: true,
      desc: "Jus pur fruits pressés",
    },
    {
      label: "Vin rouge d'Alsace Pinot Noir 75cl",
      unit: "btl",
      type: "Boisson",
      qty: 24,
      min: 6,
      cost: 35000,
      perish: false,
      desc: "Vin rouge d'importation",
    },
  ];

  const itemsMap: Record<string, string> = {};
  for (const it of itemsData) {
    const res = await client.query(
      `INSERT INTO items (label, is_produced, quantity, minimum_stock_level, is_perishable, status, id_product_type, id_unit, description, weighted_average_cost)
       VALUES ($1, false, $2, $3, $4, 1, $5, $6, $7, $8) RETURNING id_item`,
      [
        it.label,
        it.qty,
        it.min,
        it.perish,
        types[it.type],
        units[it.unit],
        it.desc,
        it.cost,
      ]
    );
    itemsMap[it.label] = res.rows[0].id_item as string;
  }

  // Produced dishes (is_produced = true) for recipes and restaurant menu
  const dishesData = [
    {
      label: "Steak de Zébu Sauce Poivre Vert & Frites",
      unit: "portion",
      type: "Plat cuisiné & Production",
      qty: 0,
      min: 0,
      cost: 8715,
      perish: true,
      desc: "Pavé de filet de zébu tendre nappé d'une sauce onctueuse au poivre vert et frites maison",
    },
    {
      label: "Romazava Traditionnel Royal & Riz Blanc",
      unit: "portion",
      type: "Plat cuisiné & Production",
      qty: 0,
      min: 0,
      cost: 5760,
      perish: true,
      desc: "Bouillon traditionnel malagasy de zébu aux brèdes mafana, tomates, oignons et riz parfumé",
    },
    {
      label: "Poulet Fermier Grillé & Purée Maison",
      unit: "portion",
      type: "Plat cuisiné & Production",
      qty: 0,
      min: 0,
      cost: 8015,
      perish: true,
      desc: "Cuisse et suprême de poulet fermier rôtis aux herbes, servis avec purée de pommes de terre au beurre",
    },
    {
      label: "Pizza Margherita au Feu de Bois",
      unit: "pc",
      type: "Plat cuisiné & Production",
      qty: 0,
      min: 0,
      cost: 6670,
      perish: true,
      desc: "Pâte fine artisanale, sauce tomate maison à l'origan, mozzarella fondante et filet d'huile d'olive",
    },
    {
      label: "Pizza Reine (Tomates, Fromage, Volaille)",
      unit: "pc",
      type: "Plat cuisiné & Production",
      qty: 0,
      min: 0,
      cost: 8270,
      perish: true,
      desc: "Pizza gourmande garnie de sauce tomate, mozzarella, émincé de poulet fermier et champignons",
    },
    {
      label: "Salade Fraîcheur Tomates & Mozzarella",
      unit: "portion",
      type: "Plat cuisiné & Production",
      qty: 0,
      min: 0,
      cost: 4215,
      perish: true,
      desc: "Rondelles de tomates fraîches, mozzarella di bufala, oignons doux et vinaigrette maison",
    },
    {
      label: "Café Expresso Pur Arabica",
      unit: "portion",
      type: "Plat cuisiné & Production",
      qty: 0,
      min: 0,
      cost: 420,
      perish: true,
      desc: "Tasse d'expresso corsé fraîchement moulu",
    },
    {
      label: "Pâte à Pizza Artisanale au Levain",
      unit: "portion",
      type: "Plat cuisiné & Production",
      qty: 0,
      min: 0,
      cost: 970,
      perish: true,
      desc: "Pâton de pâte à pizza pétri et fermenté sur place au levain",
    },
    {
      label: "Purée de Pommes de Terre Maison au Beurre",
      unit: "portion",
      type: "Plat cuisiné & Production",
      qty: 0,
      min: 0,
      cost: 2245,
      perish: true,
      desc: "Purée maison onctueuse à la crème et au beurre demi-sel",
    },
    {
      label: "Burger Gourmet Sooatel au Steak de Zébu",
      unit: "portion",
      type: "Plat cuisiné & Production",
      qty: 0,
      min: 0,
      cost: 11165,
      perish: true,
      desc: "Burger artisanal garni d'un pavé de zébu sauce poivre vert, frites, mozzarella et bun maison",
    },
  ];

  for (const d of dishesData) {
    const res = await client.query(
      `INSERT INTO items (label, is_produced, quantity, minimum_stock_level, is_perishable, status, id_product_type, id_unit, description, weighted_average_cost)
       VALUES ($1, true, $2, $3, $4, 1, $5, $6, $7, $8) RETURNING id_item`,
      [
        d.label,
        d.qty,
        d.min,
        d.perish,
        types[d.type],
        units[d.unit],
        d.desc,
        d.cost,
      ]
    );
    itemsMap[d.label] = res.rows[0].id_item as string;
  }

  return itemsMap;
}

/**
 * Seeds Suppliers, Supplier Catalog, Purchases, Deliveries, and Payments
 */
async function seedSuppliersAndPurchases(
  client: PoolClient,
  itemsMap: Record<string, string>,
  employeesMap: Record<string, string>,
  paymentMethodsMap: Record<string, string>
): Promise<void> {
  console.log("🥩 Insertion des fournisseurs, bons de commande et réceptions...");

  // Suppliers
  const sup1 = await client.query(
    `INSERT INTO supplier (name, address, description, provides_delivery, delivery_delay, notes, phone_number, email)
     VALUES ('Boucherie Centrale de Tana', 'Analakely, Antananarivo', 'Viandes de zébu et volailles locales', true, 24, 'Livraison matinale', '034 12 345 00', 'contact@boucherie-centrale.mg') RETURNING id_supplier`
  );
  const sup2 = await client.query(
    `INSERT INTO supplier (name, address, description, provides_delivery, delivery_delay, notes, phone_number, email)
     VALUES ('AgriMadagascar Primeurs', 'Route d Anosizato, Antananarivo', 'Légumes frais, riz et féculents', true, 48, 'Commandes groupées', '033 11 222 33', 'ventes@agrimad.mg') RETURNING id_supplier`
  );
  const sup3 = await client.query(
    `INSERT INTO supplier (name, address, description, provides_delivery, delivery_delay, notes, phone_number, email)
     VALUES ('STAR Madagascar Distribution', 'Andranomahery, Antananarivo', 'Brasserie, bières THB et boissons gazeuses', true, 24, 'Dépôt principal', '020 22 201 11', 'commandes@star.mg') RETURNING id_supplier`
  );
  const sup4 = await client.query(
    `INSERT INTO supplier (name, address, description, provides_delivery, delivery_delay, notes, phone_number, email)
     VALUES ('Épicerie 67Ha', '67Ha Nord-Est, Antananarivo', 'Épicerie générale, riz, condiments, épices et produits de base', true, 12, 'Livraison rapide proximité', '034 55 667 88', 'contact@epicerie67ha.mg') RETURNING id_supplier`
  );

  const supMeatId = sup1.rows[0].id_supplier as string;
  const supAgriId = sup2.rows[0].id_supplier as string;
  const supDrinkId = sup3.rows[0].id_supplier as string;
  const supGroceryId = sup4.rows[0].id_supplier as string;

  // Supplier balances
  await client.query("INSERT INTO supplier_balance (id_supplier, credit, debit) VALUES ($1, 0, 0)", [
    supMeatId,
  ]);
  await client.query("INSERT INTO supplier_balance (id_supplier, credit, debit) VALUES ($1, 0, 0)", [
    supAgriId,
  ]);
  await client.query("INSERT INTO supplier_balance (id_supplier, credit, debit) VALUES ($1, 0, 0)", [
    supDrinkId,
  ]);
  await client.query("INSERT INTO supplier_balance (id_supplier, credit, debit) VALUES ($1, 0, 0)", [
    supGroceryId,
  ]);

  // Supplier products & prices
  const catalog = [
    { supId: supMeatId, item: "Filet de zébu frais", name: "Filet de zébu 1er choix", price: 22000 },
    { supId: supMeatId, item: "Poulet fermier découpé", name: "Poulet fermier frais PAC", price: 16000 },
    { supId: supAgriId, item: "Riz blanc de Madagascar", name: "Riz Makalioka Sac 50kg", price: 120000 },
    { supId: supAgriId, item: "Pommes de terre fraîches", name: "Pommes de terre calibre 1", price: 2500 },
    { supId: supDrinkId, item: "Bière THB Pilsener 65cl", name: "THB Pilsener Casier 12 btl", price: 3600 },
    { supId: supDrinkId, item: "Eau Vive 1.5L", name: "Eau Vive Pack 6 btl", price: 1400 },
    { supId: supGroceryId, item: "Huile végétale de tournesol", name: "Huile de Tournesol Bidon 5L", price: 38000 },
    { supId: supGroceryId, item: "Farine de blé T55", name: "Farine de Blé T55 Sac 25kg", price: 95000 },
    { supId: supGroceryId, item: "Ail frais", name: "Ail blanc Filet 5kg", price: 38000 },
    { supId: supGroceryId, item: "Oignons rouges", name: "Oignons rouges Filet 10kg", price: 28000 },
    { supId: supGroceryId, item: "Poivre vert en saumure", name: "Poivre vert de Madagascar Bocal 1kg", price: 24000 },
  ];

  const supProductsMap: Record<string, { spId: string; suppliedItemId: string; price: number }> = {};

  for (const c of catalog) {
    const spRes = await client.query(
      `INSERT INTO supplier_products (id_supplier, name, actual_price, min_purchase_number, notes)
       VALUES ($1, $2, $3, 1, $2) RETURNING id_supplier_product`,
      [c.supId, c.name, c.price]
    );
    const spId = spRes.rows[0].id_supplier_product as string;

    await client.query(
      `INSERT INTO supplier_products_price (id_supplier_product, price, change_date)
       VALUES ($1, $2, '2026-01-01')`,
      [spId, c.price]
    );

    const supItemRes = await client.query(
      `INSERT INTO supplied_items (id_supplier_product, id_item)
       VALUES ($1, $2) RETURNING id_supplied_item`,
      [spId, itemsMap[c.item]]
    );
    const suppliedItemId = supItemRes.rows[0].id_supplied_item as string;

    supProductsMap[c.item] = { spId, suppliedItemId, price: c.price };
  }

  // Recent Purchase Order 1 : Viandes (Boucherie Centrale) - Reçue et payée
  const p1 = await client.query(
    `INSERT INTO purchases (purchase_date, status, id_supplier, id_purchaser, total_amount, lifecycle_status)
     VALUES ('2026-11-10 09:30:00', 2, $1, $2, 600000, 2) RETURNING id_purchase`,
    [supMeatId, employeesMap["chef"]]
  );
  const p1Id = p1.rows[0].id_purchase as string;

  const zebuProduct = supProductsMap["Filet de zébu frais"];
  const pouletProduct = supProductsMap["Poulet fermier découpé"];

  if (zebuProduct && pouletProduct) {
    await client.query(
      `INSERT INTO purchase_details (id_purchase, id_supplied_item, quantity, unit_price, total_amount)
       VALUES ($1, $2, 20, 22000, 440000)`,
      [p1Id, zebuProduct.suppliedItemId]
    );
    await client.query(
      `INSERT INTO purchase_details (id_purchase, id_supplied_item, quantity, unit_price, total_amount)
       VALUES ($1, $2, 10, 16000, 160000)`,
      [p1Id, pouletProduct.suppliedItemId]
    );
  }

  // Delivery for Purchase 1
  const del1 = await client.query(
    `INSERT INTO product_delivery (delivery_date, total_amount, balance_due, status, notes)
     VALUES ('2026-11-10 14:00:00+03', 600000, 0, 1, 'Livraison conforme par camion frigorifique') RETURNING id_delivery`
  );
  const del1Id = del1.rows[0].id_delivery as string;

  await client.query(
    "INSERT INTO purchase_delivery (id_purchase, id_delivery) VALUES ($1, $2)",
    [p1Id, del1Id]
  );

  if (zebuProduct && pouletProduct) {
    await client.query(
      `INSERT INTO delivery_details (id_delivery, id_supplied_item, quantity, unit_price, total_amount)
       VALUES ($1, $2, 20, 22000, 440000)`,
      [del1Id, zebuProduct.suppliedItemId]
    );
    await client.query(
      `INSERT INTO delivery_details (id_delivery, id_supplied_item, quantity, unit_price, total_amount)
       VALUES ($1, $2, 10, 16000, 160000)`,
      [del1Id, pouletProduct.suppliedItemId]
    );
  }

  // Payment for Supplier 1
  const pay1 = await client.query(
    `INSERT INTO supplier_payment (payment_date, amount, id_processed_by, id_supplier, notes)
     VALUES ('2026-11-11', 600000, $1, $2, 'Règlement virement bancaire facture livraison viande') RETURNING id_supplier_payment`,
    [employeesMap["manager"], supMeatId]
  );
  const pay1Id = pay1.rows[0].id_supplier_payment as string;

  const virementId = paymentMethodsMap["Virement Bancaire"];
  if (virementId) {
    await client.query(
      `INSERT INTO supplier_payment_line (id_supplier_payment, id_payment_method, amount)
       VALUES ($1, $2, 600000)`,
      [pay1Id, virementId]
    );
  }

  await client.query(
    `INSERT INTO supplier_payment_allocation (id_supplier_payment, allocation_type, id_delivery, amount)
     VALUES ($1, 'DELIVERY', $2, 600000)`,
    [pay1Id, del1Id]
  );
}

/**
 * Seeds Stock Movements History and Drafts
 */
async function seedStockMovements(
  client: PoolClient,
  itemsMap: Record<string, string>,
  employeesMap: Record<string, string>
): Promise<void> {
  console.log("📦 Insertion de l'historique et des mouvements de stock...");

  const chefId = employeesMap["chef"] as string;
  const commisId = employeesMap["commis"] as string;
  const barmanId = employeesMap["barman"] as string;
  const managerId = employeesMap["manager"] as string;

  const movements = [
    // 1. Réceptions Fournisseurs (direction: 5 = IN, type: 1 = RECEPTION, status: 0 = VALIDATED)
    {
      item: "Filet de zébu frais",
      date: "2026-10-18 08:30:00+03",
      qty: 25,
      type: 1,
      dir: 5,
      reason: "Réception BC-2026-001 - Boucherie Centrale (Filet de zébu 1er choix)",
      status: 0,
      op: chefId,
    },
    {
      item: "Poulet fermier découpé",
      date: "2026-10-18 08:45:00+03",
      qty: 20,
      type: 1,
      dir: 5,
      reason: "Réception BC-2026-001 - Boucherie Centrale (Poulet fermier PAC)",
      status: 0,
      op: chefId,
    },
    {
      item: "Riz blanc de Madagascar",
      date: "2026-10-19 09:15:00+03",
      qty: 150,
      type: 1,
      dir: 5,
      reason: "Réception BC-2026-002 - AgriMadagascar (3 sacs Riz Makalioka 50kg)",
      status: 0,
      op: managerId,
    },
    {
      item: "Pommes de terre fraîches",
      date: "2026-10-19 09:30:00+03",
      qty: 60,
      type: 1,
      dir: 5,
      reason: "Réception BC-2026-002 - AgriMadagascar (Pommes de terre Ankaratra)",
      status: 0,
      op: commisId,
    },
    {
      item: "Bière THB Pilsener 65cl",
      date: "2026-10-22 10:00:00+03",
      qty: 144,
      type: 1,
      dir: 5,
      reason: "Réception STAR Madagascar - Livraison brasserie 12 casiers THB",
      status: 0,
      op: barmanId,
    },
    {
      item: "Coca-Cola 33cl",
      date: "2026-10-22 10:15:00+03",
      qty: 96,
      type: 1,
      dir: 5,
      reason: "Réception STAR Madagascar - Livraison sodas 4 casiers Coca-Cola",
      status: 0,
      op: barmanId,
    },
    {
      item: "Eau Vive 1.5L",
      date: "2026-10-22 10:30:00+03",
      qty: 180,
      type: 1,
      dir: 5,
      reason: "Réception STAR Madagascar - Livraison eaux minérales 30 packs",
      status: 0,
      op: barmanId,
    },
    {
      item: "Tomates fraîches",
      date: "2026-10-25 08:00:00+03",
      qty: 25,
      type: 1,
      dir: 5,
      reason: "Livraison primeurs maraîchers locaux - Tomates fraîches de saison",
      status: 0,
      op: commisId,
    },
    {
      item: "Oignons rouges",
      date: "2026-10-25 08:15:00+03",
      qty: 30,
      type: 1,
      dir: 5,
      reason: "Livraison primeurs maraîchers locaux - Oignons rouges de conservation",
      status: 0,
      op: commisId,
    },
    {
      item: "Farine de blé T55",
      date: "2026-10-28 09:00:00+03",
      qty: 50,
      type: 1,
      dir: 5,
      reason: "Réception grossiste meunerie - Sac farine T55 spéciale pizza",
      status: 0,
      op: chefId,
    },
    {
      item: "Mozzarella râpée",
      date: "2026-10-28 09:20:00+03",
      qty: 20,
      type: 1,
      dir: 5,
      reason: "Réception crémerie - Mozzarella râpée pour pizzeria",
      status: 0,
      op: chefId,
    },
    {
      item: "Huile végétale de tournesol",
      date: "2026-10-28 09:35:00+03",
      qty: 40,
      type: 1,
      dir: 5,
      reason: "Réception grossiste épicerie - Bidons d'huile végétale",
      status: 0,
      op: commisId,
    },
    {
      item: "Vin rouge d'Alsace Pinot Noir 75cl",
      date: "2026-11-02 11:00:00+03",
      qty: 24,
      type: 1,
      dir: 5,
      reason: "Réception importateur vins et spiritueux - 2 cartons Pinot Noir",
      status: 0,
      op: managerId,
    },
    {
      item: "Filet de zébu frais",
      date: "2026-11-05 08:30:00+03",
      qty: 20,
      type: 1,
      dir: 5,
      reason: "Réapprovisionnement Boucherie Centrale - Zébu frais pour le weekend",
      status: 0,
      op: chefId,
    },
    {
      item: "Poulet fermier découpé",
      date: "2026-11-05 08:45:00+03",
      qty: 15,
      type: 1,
      dir: 5,
      reason: "Réapprovisionnement Boucherie Centrale - Poulet fermier découpé",
      status: 0,
      op: chefId,
    },

    // 2. Sorties Manuelles Cuisine & Bar (direction: -5 = OUT, type: 2 = MANUEL, status: 0 = VALIDATED)
    {
      item: "Filet de zébu frais",
      date: "2026-10-20 11:00:00+03",
      qty: 8,
      type: 2,
      dir: -5,
      reason: "Sortie cuisine - Mise en place service déjeuner du weekend",
      status: 0,
      op: chefId,
    },
    {
      item: "Pommes de terre fraîches",
      date: "2026-10-20 11:15:00+03",
      qty: 15,
      type: 2,
      dir: -5,
      reason: "Sortie cuisine - Préparation frites fraîches et purée maison",
      status: 0,
      op: commisId,
    },
    {
      item: "Bière THB Pilsener 65cl",
      date: "2026-10-21 16:00:00+03",
      qty: 36,
      type: 2,
      dir: -5,
      reason: "Sortie bar - Approvisionnement des réfrigérateurs de comptoir",
      status: 0,
      op: barmanId,
    },
    {
      item: "Coca-Cola 33cl",
      date: "2026-10-21 16:15:00+03",
      qty: 24,
      type: 2,
      dir: -5,
      reason: "Sortie bar - Réassort vitrine boissons fraîches",
      status: 0,
      op: barmanId,
    },
    {
      item: "Farine de blé T55",
      date: "2026-10-26 15:30:00+03",
      qty: 10,
      type: 2,
      dir: -5,
      reason: "Sortie cuisine - Pétrissage des pâtons de pizza pour la semaine",
      status: 0,
      op: chefId,
    },
    {
      item: "Mozzarella râpée",
      date: "2026-10-26 15:45:00+03",
      qty: 6,
      type: 2,
      dir: -5,
      reason: "Sortie cuisine - Mise en place poste pizza",
      status: 0,
      op: chefId,
    },
    {
      item: "Brèdes mafana",
      date: "2026-10-29 09:30:00+03",
      qty: 5,
      type: 2,
      dir: -5,
      reason: "Sortie cuisine - Préparation grand Romazava royal banquet",
      status: 0,
      op: commisId,
    },
    {
      item: "Riz blanc de Madagascar",
      date: "2026-10-29 09:45:00+03",
      qty: 10,
      type: 2,
      dir: -5,
      reason: "Sortie économat - Cuisson riz blanc d'accompagnement",
      status: 0,
      op: commisId,
    },
    {
      item: "Eau Vive 1.5L",
      date: "2026-11-01 14:00:00+03",
      qty: 24,
      type: 2,
      dir: -5,
      reason: "Sortie bar & salle - Eau de table pour buffet déjeuner",
      status: 0,
      op: barmanId,
    },
    {
      item: "Vin rouge d'Alsace Pinot Noir 75cl",
      date: "2026-11-03 19:00:00+03",
      qty: 6,
      type: 2,
      dir: -5,
      reason: "Sortie cave restaurant - Table banquet d'entreprise (6 btl)",
      status: 0,
      op: barmanId,
    },
    {
      item: "Poulet fermier découpé",
      date: "2026-11-08 10:30:00+03",
      qty: 10,
      type: 2,
      dir: -5,
      reason: "Sortie cuisine - Préparation grillades poulet dimanche midi",
      status: 0,
      op: chefId,
    },
    {
      item: "Bière THB Pilsener 65cl",
      date: "2026-11-12 17:00:00+03",
      qty: 24,
      type: 2,
      dir: -5,
      reason: "Sortie bar - Réassort frigo terrasse après-midi",
      status: 0,
      op: barmanId,
    },
    {
      item: "Filet de zébu frais",
      date: "2026-11-14 11:00:00+03",
      qty: 7,
      type: 2,
      dir: -5,
      reason: "Sortie cuisine - Préparation pavés de zébu sauce poivre vert",
      status: 0,
      op: commisId,
    },
    {
      item: "Pommes de terre fraîches",
      date: "2026-11-14 11:15:00+03",
      qty: 12,
      type: 2,
      dir: -5,
      reason: "Sortie cuisine - Épluchage frites fraîches pour le service",
      status: 0,
      op: commisId,
    },

    // 3. Pertes & Casses (direction: -5 = OUT, type: 3 = PERTE, status: 0 = VALIDATED)
    {
      item: "Bière THB Pilsener 65cl",
      date: "2026-10-24 18:30:00+03",
      qty: 2,
      type: 3,
      dir: -5,
      reason: "Casse accidentelle - 2 bouteilles tombées du plateau en salle",
      status: 0,
      op: barmanId,
    },
    {
      item: "Tomates fraîches",
      date: "2026-10-31 09:00:00+03",
      qty: 2,
      type: 3,
      dir: -5,
      reason: "Avarie primeurs - Tomates écrasées écartées lors du tri matinal",
      status: 0,
      op: commisId,
    },
    {
      item: "Vin rouge d'Alsace Pinot Noir 75cl",
      date: "2026-11-07 20:45:00+03",
      qty: 1,
      type: 3,
      dir: -5,
      reason: "Bouteille cassée par maladresse au comptoir du bar",
      status: 0,
      op: barmanId,
    },
    {
      item: "Crème fraîche liquide",
      date: "2026-11-11 08:30:00+03",
      qty: 1,
      type: 3,
      dir: -5,
      reason: "Péremption DLC - Brique entamée non utilisable rejetée au contrôle",
      status: 0,
      op: chefId,
    },

    // 4. Régularisations d'Inventaire (type: 4 = INVENTAIRE, status: 0 = VALIDATED)
    {
      item: "Café d'Arabica moulu",
      date: "2026-10-31 18:00:00+03",
      qty: 1,
      type: 4,
      dir: 5,
      reason: "Régularisation inventaire mensuel octobre - Écart positif comptage physique",
      status: 0,
      op: managerId,
    },
    {
      item: "Oignons rouges",
      date: "2026-10-31 18:15:00+03",
      qty: 1.5,
      type: 4,
      dir: -5,
      reason: "Régularisation inventaire mensuel octobre - Perte naturelle de poids par dessiccation",
      status: 0,
      op: managerId,
    },

    // 5. Mouvements Brouillons (status: 5 = DRAFT)
    {
      item: "Filet de zébu frais",
      date: "2026-11-15 08:00:00+03",
      qty: 15,
      type: 1,
      dir: 5,
      reason: "Brouillon : Réapprovisionnement viande fraîche attendu ce midi",
      status: 5,
      op: chefId,
    },
    {
      item: "Eau Vive 1.5L",
      date: "2026-11-15 09:30:00+03",
      qty: 2,
      type: 3,
      dir: -5,
      reason: "Brouillon : Déclaration de casse à valider par le responsable de salle",
      status: 5,
      op: barmanId,
    },
  ];

  for (const m of movements) {
    const itemId = itemsMap[m.item];
    if (!itemId) {
      console.warn(`Item non trouvé pour mouvement : ${m.item}`);
      continue;
    }

    await client.query(
      `INSERT INTO stock_movement (id_item, movement_date, quantity, movement_type, direction, reason, status, id_operator)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [itemId, m.date, m.qty, m.type, m.dir, m.reason, m.status, m.op]
    );
  }
}

/**
 * Seeds Menu Categories, Menu Items, and Kitchen Recipes (Fiches techniques)
 */
async function seedMenuAndRecipes(
  client: PoolClient,
  itemsMap: Record<string, string>
): Promise<Record<string, string>> {
  console.log("🍽️ Insertion de la carte du restaurant et des fiches techniques...");

  // Menu Categories
  const categoriesData = [
    { label: "Entrées froides & Salades", desc: "Entrées fraîches, salades composées et crudités" },
    { label: "Entrées chaudes, Soupes & Veloutés", desc: "Potages, soupes de poissons et veloutés de saison" },
    { label: "Plats de Zébu & Viandes Rouges", desc: "Filets, faux-filets et grillades de zébu de Madagascar" },
    { label: "Volailles & Plats Mijotés", desc: "Poulet fermier, canard et plats mijotés à la créole" },
    { label: "Poissons, Crevettes & Fruits de Mer", desc: "Camarons, poissons du canal du Mozambique et fruits de mer" },
    { label: "Spécialités Malagasy & Plats Traditionnels", desc: "Romazava royal, Ravitoto sy henakisoa et plats du terroir" },
    { label: "Pizzas Artisanales au Feu de Bois", desc: "Pizzas croustillantes cuites au four à bois traditionnel" },
    { label: "Pâtes Fraîches & Risottos", desc: "Pâtes artisanales, lasagnes et risottos onctueux" },
    { label: "Burgers Maison & Snacks", desc: "Burgers au zébu, paninis et sandwichs club" },
    { label: "Desserts Faits Maison & Pâtisseries", desc: "Fondants au chocolat, crêpes, tartes aux fruits locaux" },
    { label: "Glaces Artisanales & Sorbets", desc: "Parfums vanille de Madagascar, chocolat et fruits exotiques" },
    { label: "Boissons Rafraîchissantes & Sodas", desc: "Sodas, eaux minérales et jus de fruits naturels pressés" },
    { label: "Bières Locales & Importées", desc: "THB, Castel Beer, Skol et bières internationales" },
    { label: "Vins, Champagnes & Spiritueux", desc: "Vins rouges, blancs, rosés, champagnes et rhums arrangés" },
    { label: "Cocktails Maison & Apéritifs", desc: "Cocktails exotiques, mojitos et apéritifs anisés" },
    { label: "Cafés, Thés & Boissons Chaudes", desc: "Cafés pur arabica, thés parfumés et infusions digestives" },
  ];
  const cats: Record<string, string> = {};
  for (const c of categoriesData) {
    const res = await client.query(
      "INSERT INTO menu_categories (label, description) VALUES ($1, $2) RETURNING id_category",
      [c.label, c.desc]
    );
    cats[c.label] = res.rows[0].id_category as string;
  }

  // Menu Items: directly references produced dishes and beverages
  const menuData = [
    {
      label: "Burger Gourmet Sooatel au Steak de Zébu",
      cat: "Burgers Maison & Snacks",
      price: 32000,
      cost: 11165,
      itemKey: "Burger Gourmet Sooatel au Steak de Zébu",
    },
    {
      label: "Portion de Purée Maison au Beurre",
      cat: "Entrées chaudes, Soupes & Veloutés",
      price: 8000,
      cost: 2245,
      itemKey: "Purée de Pommes de Terre Maison au Beurre",
    },
    {
      label: "Salade Fraîcheur Tomates & Mozzarella",
      cat: "Entrées froides & Salades",
      price: 15000,
      cost: 4215,
      itemKey: "Salade Fraîcheur Tomates & Mozzarella",
    },
    {
      label: "Steak de Zébu Sauce Poivre Vert & Frites",
      cat: "Plats de Zébu & Viandes Rouges",
      price: 28000,
      cost: 8715,
      itemKey: "Steak de Zébu Sauce Poivre Vert & Frites",
    },
    {
      label: "Romazava Traditionnel Royal & Riz Blanc",
      cat: "Spécialités Malagasy & Plats Traditionnels",
      price: 24000,
      cost: 5760,
      itemKey: "Romazava Traditionnel Royal & Riz Blanc",
    },
    {
      label: "Poulet Fermier Grillé & Purée Maison",
      cat: "Volailles & Plats Mijotés",
      price: 25000,
      cost: 8015,
      itemKey: "Poulet Fermier Grillé & Purée Maison",
    },
    {
      label: "Pizza Margherita au Feu de Bois",
      cat: "Pizzas Artisanales au Feu de Bois",
      price: 22000,
      cost: 6670,
      itemKey: "Pizza Margherita au Feu de Bois",
    },
    {
      label: "Pizza Reine (Tomates, Fromage, Volaille)",
      cat: "Pizzas Artisanales au Feu de Bois",
      price: 26000,
      cost: 8270,
      itemKey: "Pizza Reine (Tomates, Fromage, Volaille)",
    },
    {
      label: "Café Expresso Pur Arabica",
      cat: "Cafés, Thés & Boissons Chaudes",
      price: 4000,
      cost: 420,
      itemKey: "Café Expresso Pur Arabica",
    },
    {
      label: "Bière THB Pilsener Fraîche 65cl",
      cat: "Bières Locales & Importées",
      price: 6000,
      cost: 3600,
      itemKey: "Bière THB Pilsener 65cl",
    },
    {
      label: "Coca-Cola Frais 33cl",
      cat: "Boissons Rafraîchissantes & Sodas",
      price: 4500,
      cost: 2200,
      itemKey: "Coca-Cola 33cl",
    },
    {
      label: "Eau Vive 1.5L Fraîche",
      cat: "Boissons Rafraîchissantes & Sodas",
      price: 3500,
      cost: 1400,
      itemKey: "Eau Vive 1.5L",
    },
    {
      label: "Bouteille Vin Rouge d'Alsace 75cl",
      cat: "Vins, Champagnes & Spiritueux",
      price: 55000,
      cost: 35000,
      itemKey: "Vin rouge d'Alsace Pinot Noir 75cl",
    },
  ];

  const menuItemsMap: Record<string, string> = {};

  for (const m of menuData) {
    const res = await client.query(
      `INSERT INTO menu_items (id_item, sale_price, unit_cost, id_category)
       VALUES ($1, $2, $3, $4) RETURNING id_menu`,
      [itemsMap[m.itemKey], m.price, m.cost, cats[m.cat]]
    );
    menuItemsMap[m.label] = res.rows[0].id_menu as string;
  }

  // Kitchen Recipes (Fiches techniques) helper
  async function insertRecipe(
    dishName: string,
    version: number,
    cost: number,
    isActive: boolean,
    ingredients: Array<{ name: string; qty: number }>
  ): Promise<string> {
    const dishId = itemsMap[dishName];
    const recRes = await client.query(
      `INSERT INTO recipes (id_item, yield_quantity, recipe_cost, version, is_active)
       VALUES ($1, 1, $2, $3, $4) RETURNING id_recipe`,
      [dishId, cost, version, isActive]
    );
    const recId = recRes.rows[0].id_recipe as string;

    for (const ing of ingredients) {
      await client.query(
        `INSERT INTO recipe_details (id_recipe, id_ingredient, quantity)
         VALUES ($1, $2, $3)`,
        [recId, itemsMap[ing.name], ing.qty]
      );
    }
    return recId;
  }

  // Recipe: Pâte à Pizza Artisanale (Sous-recette de base pour les pizzas)
  await insertRecipe(
    "Pâte à Pizza Artisanale au Levain",
    1,
    970,
    true,
    [
      { name: "Farine de blé T55", qty: 0.20 },
      { name: "Huile végétale de tournesol", qty: 0.02 },
    ]
  );

  // Recipe: Purée de Pommes de Terre Maison au Beurre (Plat d'accompagnement & sous-recette)
  await insertRecipe(
    "Purée de Pommes de Terre Maison au Beurre",
    1,
    2245,
    true,
    [
      { name: "Pommes de terre fraîches", qty: 0.25 },
      { name: "Beurre demi-sel", qty: 0.03 },
      { name: "Crème fraîche liquide", qty: 0.05 },
      { name: "Ail frais", qty: 0.01 },
    ]
  );

  // Recipe 1 : Steak de Zébu Sauce Poivre Vert & Frites (Version 1 - Active)
  await insertRecipe(
    "Steak de Zébu Sauce Poivre Vert & Frites",
    1,
    8715,
    true,
    [
      { name: "Filet de zébu frais", qty: 0.25 },
      { name: "Pommes de terre fraîches", qty: 0.30 },
      { name: "Huile végétale de tournesol", qty: 0.05 },
      { name: "Beurre demi-sel", qty: 0.03 },
      { name: "Crème fraîche liquide", qty: 0.05 },
      { name: "Poivre vert en saumure", qty: 0.02 },
    ]
  );

  // Recipe 1 (Version 2 - Historique): Steak de Zébu avec réduction au vin rouge
  await insertRecipe(
    "Steak de Zébu Sauce Poivre Vert & Frites",
    2,
    10450,
    false,
    [
      { name: "Filet de zébu frais", qty: 0.28 },
      { name: "Pommes de terre fraîches", qty: 0.30 },
      { name: "Beurre demi-sel", qty: 0.04 },
      { name: "Crème fraîche liquide", qty: 0.06 },
      { name: "Poivre vert en saumure", qty: 0.025 },
      { name: "Vin rouge d'Alsace Pinot Noir 75cl", qty: 0.05 },
    ]
  );

  // Recipe: Burger Gourmet Sooatel au Steak de Zébu (Plat composite contenant le plat Steak de Zébu)
  await insertRecipe(
    "Burger Gourmet Sooatel au Steak de Zébu",
    1,
    11165,
    true,
    [
      { name: "Steak de Zébu Sauce Poivre Vert & Frites", qty: 1.0 },
      { name: "Farine de blé T55", qty: 0.12 },
      { name: "Tomates fraîches", qty: 0.08 },
      { name: "Mozzarella râpée", qty: 0.05 },
      { name: "Oignons rouges", qty: 0.03 },
    ]
  );

  // Recipe 2 : Romazava Traditionnel Royal & Riz Blanc
  await insertRecipe(
    "Romazava Traditionnel Royal & Riz Blanc",
    1,
    5760,
    true,
    [
      { name: "Filet de zébu frais", qty: 0.20 },
      { name: "Brèdes mafana", qty: 0.15 },
      { name: "Tomates fraîches", qty: 0.10 },
      { name: "Oignons rouges", qty: 0.05 },
      { name: "Ail frais", qty: 0.01 },
      { name: "Riz blanc de Madagascar", qty: 0.20 },
    ]
  );

  // Recipe 3 : Poulet Fermier Grillé & Purée Maison (Contient le plat Purée Maison)
  await insertRecipe(
    "Poulet Fermier Grillé & Purée Maison",
    1,
    8015,
    true,
    [
      { name: "Poulet fermier découpé", qty: 0.35 },
      { name: "Huile végétale de tournesol", qty: 0.02 },
      { name: "Purée de Pommes de Terre Maison au Beurre", qty: 1.0 },
    ]
  );

  // Recipe 4 : Pizza Margherita au Feu de Bois (Contient la sous-recette Pâte à Pizza)
  await insertRecipe(
    "Pizza Margherita au Feu de Bois",
    1,
    6670,
    true,
    [
      { name: "Pâte à Pizza Artisanale au Levain", qty: 1.0 },
      { name: "Sauce tomate spéciale pizza", qty: 0.10 },
      { name: "Mozzarella râpée", qty: 0.15 },
    ]
  );

  // Recipe 5 : Pizza Reine (Tomates, Fromage, Volaille) (Contient la sous-recette Pâte à Pizza)
  await insertRecipe(
    "Pizza Reine (Tomates, Fromage, Volaille)",
    1,
    8270,
    true,
    [
      { name: "Pâte à Pizza Artisanale au Levain", qty: 1.0 },
      { name: "Sauce tomate spéciale pizza", qty: 0.10 },
      { name: "Mozzarella râpée", qty: 0.15 },
      { name: "Poulet fermier découpé", qty: 0.10 },
    ]
  );

  // Recipe 6 : Salade Fraîcheur Tomates & Mozzarella
  await insertRecipe(
    "Salade Fraîcheur Tomates & Mozzarella",
    1,
    4215,
    true,
    [
      { name: "Tomates fraîches", qty: 0.20 },
      { name: "Mozzarella râpée", qty: 0.10 },
      { name: "Huile végétale de tournesol", qty: 0.03 },
      { name: "Oignons rouges", qty: 0.02 },
    ]
  );

  // Recipe 7 : Café Expresso Pur Arabica
  await insertRecipe(
    "Café Expresso Pur Arabica",
    1,
    420,
    true,
    [
      { name: "Café d'Arabica moulu", qty: 0.015 },
    ]
  );

  return menuItemsMap;
}

/**
 * Seeds Dish Productions
 */
async function seedDishProductions(
  client: PoolClient,
  itemsMap: Record<string, string>,
  employeesMap: Record<string, string>
): Promise<void> {
  console.log("🍲 Insertion des productions culinaires (dish_production)...");

  const chefId = employeesMap["chef"] as string;

  const productions = [
    { item: "Steak de Zébu Sauce Poivre Vert & Frites", qty: 15, status: 0, notes: "Production du jour - Service midi" },
    { item: "Romazava Traditionnel Royal & Riz Blanc", qty: 20, status: 0, notes: "Marmite Romazava royal du chef" },
    { item: "Burger Gourmet Sooatel au Steak de Zébu", qty: 12, status: 0, notes: "Préparation steaks et burgers" },
    { item: "Poulet Fermier Grillé & Purée Maison", qty: 8, status: 5, notes: "En cours de cuisson / Service du soir" },
  ];

  for (const p of productions) {
    const itemId = itemsMap[p.item];
    if (itemId) {
      await client.query(
        `INSERT INTO dish_production (id_item, production_date, quantity, status, id_operator, notes)
         VALUES ($1, CURRENT_TIMESTAMP, $2, $3, $4, $5)`,
        [itemId, p.qty, p.status, chefId, p.notes]
      );
    }
  }
}

/**
 * Seeds Payment Methods, Cash Journal, and Cash Movements
 */
async function seedPaymentMethodsAndCash(
  client: PoolClient,
  employeesMap: Record<string, string>
): Promise<{ paymentMethods: Record<string, string>; journalId: string }> {
  console.log("💰 Configuration des modes de paiement et de la caisse...");

  const pmData = [
    { label: "Espèces", desc: "Paiement en espèces (Ariary)" },
    { label: "Carte Bancaire", desc: "Terminal TPE Visa / Mastercard" },
    { label: "Mobile Money - Mvola", desc: "Paiement marchand Mvola" },
    { label: "Mobile Money - Orange Money", desc: "Paiement marchand Orange Money" },
    { label: "Mobile Money - Airtel Money", desc: "Paiement marchand Airtel Money" },
    { label: "Virement Bancaire", desc: "Virement bancaire pro" },
    { label: "Chèque Bancaire", desc: "Chèque certifié de banque" },
    { label: "Facturation sur Chambre", desc: "Report sur note de chambre" },
  ];
  const paymentMethods: Record<string, string> = {};
  for (const pm of pmData) {
    const res = await client.query(
      "INSERT INTO payment_method (label, description) VALUES ($1, $2) RETURNING id_payment_method",
      [pm.label, pm.desc]
    );
    paymentMethods[pm.label] = res.rows[0].id_payment_method as string;
  }

  // Cash movement categories (5 in, 5 out, 1 both)
  const cashCategoriesData = [
    { label: "Fond de caisse initial", direction: 5 },
    { label: "Encaissement Vente Restaurant & Bar", direction: 5 },
    { label: "Encaissement Séjour & Hébergement", direction: 5 },
    { label: "Apport de trésorerie / Dépôt gérant", direction: 5 },
    { label: "Remboursement avance employé", direction: 5 },
    { label: "Petite dépense urgente cuisine / marché", direction: -5 },
    { label: "Dépôt en banque / Versement coffre", direction: -5 },
    { label: "Avance sur salaire employé", direction: -5 },
    { label: "Paiement fournisseur au comptant", direction: -5 },
    { label: "Frais de transport & courses urgentes", direction: -5 },
    { label: "Ajustement / Écart de caisse", direction: 0 },
  ];
  const cashCategoriesMap: Record<string, string> = {};
  for (const cc of cashCategoriesData) {
    const res = await client.query(
      "INSERT INTO cash_movement_category (label, allowed_direction) VALUES ($1, $2) RETURNING id_cash_movement_category",
      [cc.label, cc.direction]
    );
    cashCategoriesMap[cc.label] = res.rows[0].id_cash_movement_category as string;
  }

  const catFondId = cashCategoriesMap["Fond de caisse initial"] as string;

  // Initial funds for cash and mobile money
  const initialFunds = [
    { pmLabel: "Espèces", amount: 500000, reason: "Ouverture de caisse - Fond initial espèces" },
    { pmLabel: "Mobile Money - Mvola", amount: 1200000, reason: "Solde initial compte Telma Mvola Marchand" },
    { pmLabel: "Mobile Money - Orange Money", amount: 800000, reason: "Solde initial compte Orange Money Marchand" },
    { pmLabel: "Mobile Money - Airtel Money", amount: 400000, reason: "Solde initial compte Airtel Money Marchand" },
    { pmLabel: "Carte Bancaire", amount: 1500000, reason: "Solde initial compte TPE Carte Bancaire" },
  ];

  const totalOpeningBalance = initialFunds.reduce((sum, f) => sum + f.amount, 0);

  // Active open cash journal for today
  const todayMorning = new Date();
  todayMorning.setHours(7, 0, 0, 0);

  const jrn = await client.query(
    `INSERT INTO cash_journal (journal_opening, expected_closing_balance, id_cashier)
     VALUES ($1, $2, $3) RETURNING id_journal`,
    [todayMorning, totalOpeningBalance, employeesMap["serveur"]]
  );
  const journalId = jrn.rows[0].id_journal as string;

  for (const f of initialFunds) {
    const pmId = paymentMethods[f.pmLabel];
    if (!pmId) continue;

    // 1. Record cash movement (direction 5 = Inflow / Entrée)
    await client.query(
      `INSERT INTO cash_movement (amount, movement_date, reason, id_processed_by, id_journal, id_cash_movement_category, direction, id_payment_method, status)
       VALUES ($1, $2, $3, $4, $5, $6, 5, $7, 0)`,
      [f.amount, todayMorning, f.reason, employeesMap["serveur"], journalId, catFondId, pmId]
    );

    // 2. Set payment_method_balance
    await client.query(
      `INSERT INTO payment_method_balance (id_journal, id_payment_method, amount)
       VALUES ($1, $2, $3)`,
      [journalId, pmId, f.amount]
    );
  }

  return { paymentMethods, journalId };
}

/**
 * Seeds Realistic Sales, Invoices, Orders, Payments, and Table orders
 */
async function seedSalesAndPOS(
  client: PoolClient,
  employeesMap: Record<string, string>,
  usersMap: Record<string, string>,
  menuItemsMap: Record<string, string>,
  roomsMap: Record<string, string>,
  paymentMethodsMap: Record<string, string>
): Promise<void> {
  console.log("🧾 Insertion des ventes, tickets de caisse et commandes en cours...");

  const creatorUserId = usersMap["malalni04"] as string;
  const waiterId = employeesMap["serveur"] as string;
  const barmanId = employeesMap["barman"] as string;

  // Helper to create a complete closed & paid sale
  async function createClosedSale(
    saleDate: string,
    tableNum: number,
    salerId: string,
    items: Array<{ menuLabel: string; qty: number; unitPrice: number; unitCost: number }>,
    pmLabel: string,
    roomId?: string
  ): Promise<void> {
    const totalAmount = items.reduce((acc, it) => acc + it.qty * it.unitPrice, 0);

    // 1. Invoice
    const inv = await client.query(
      `INSERT INTO invoice (invoice_date, total_amount, balance_due, status, created_at, created_by)
       VALUES ($1, $2, 0, 0, $1, $3) RETURNING id_invoice`,
      [saleDate, totalAmount, creatorUserId]
    );
    const invId = inv.rows[0].id_invoice as string;

    // 2. Sale (status 0 = closed)
    let saleId = "";
    if (roomId) {
      const sale = await client.query(
        `INSERT INTO sales (total_amount, table_number, charge_to_room, id_room, id_saler, status, created_at, created_by, id_invoice, sale_date)
         VALUES ($1, $2, true, $3, $4, 0, $5, $6, $7, $5) RETURNING id_sale`,
        [totalAmount, tableNum, roomId, salerId, saleDate, creatorUserId, invId]
      );
      saleId = sale.rows[0].id_sale as string;
    } else {
      const sale = await client.query(
        `INSERT INTO sales (total_amount, table_number, charge_to_room, id_saler, status, created_at, created_by, id_invoice, sale_date)
         VALUES ($1, $2, false, $3, 0, $4, $5, $6, $4) RETURNING id_sale`,
        [totalAmount, tableNum, salerId, saleDate, creatorUserId, invId]
      );
      saleId = sale.rows[0].id_sale as string;
    }

    // 3. Sale Items
    for (const it of items) {
      await client.query(
        `INSERT INTO sale_items (id_menu, id_sale, quantity, unit_price, total_amount, unit_cost)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [menuItemsMap[it.menuLabel], saleId, it.qty, it.unitPrice, it.qty * it.unitPrice, it.unitCost]
      );
    }

    // 4. Payment
    await client.query(
      `INSERT INTO payment (id_invoice, amount, id_payment_method, payment_date)
       VALUES ($1, $2, $3, $4)`,
      [invId, totalAmount, paymentMethodsMap[pmLabel], saleDate]
    );
  }

  // Predefined realistic restaurant order combos
  const mealCombos = [
    // Combo 1 : Dîner zébu pour 2
    [
      { menuLabel: "Steak de Zébu Sauce Poivre Vert & Frites", qty: 2, unitPrice: 28000, unitCost: 9500 },
      { menuLabel: "Bière THB Pilsener Fraîche 65cl", qty: 2, unitPrice: 6000, unitCost: 3600 },
      { menuLabel: "Café Expresso Pur Arabica", qty: 2, unitPrice: 4000, unitCost: 1200 },
    ],
    // Combo 2 : Déjeuner malagasy romazava
    [
      { menuLabel: "Romazava Traditionnel Royal & Riz Blanc", qty: 2, unitPrice: 24000, unitCost: 7800 },
      { menuLabel: "Salade Fraîcheur Tomates & Mozzarella", qty: 1, unitPrice: 15000, unitCost: 4800 },
      { menuLabel: "Coca-Cola Frais 33cl", qty: 2, unitPrice: 4500, unitCost: 2200 },
    ],
    // Combo 3 : Soirée Pizzas & Bières
    [
      { menuLabel: "Pizza Reine (Tomates, Fromage, Volaille)", qty: 2, unitPrice: 26000, unitCost: 8000 },
      { menuLabel: "Pizza Margherita au Feu de Bois", qty: 1, unitPrice: 22000, unitCost: 6500 },
      { menuLabel: "Bière THB Pilsener Fraîche 65cl", qty: 3, unitPrice: 6000, unitCost: 3600 },
    ],
    // Combo 4 : Déjeuner léger poulet fermier
    [
      { menuLabel: "Poulet Fermier Grillé & Purée Maison", qty: 1, unitPrice: 25000, unitCost: 8200 },
      { menuLabel: "Eau Vive 1.5L Fraîche", qty: 1, unitPrice: 3500, unitCost: 1400 },
      { menuLabel: "Café Expresso Pur Arabica", qty: 1, unitPrice: 4000, unitCost: 1200 },
    ],
    // Combo 5 : Grande table / Repas d'affaires
    [
      { menuLabel: "Steak de Zébu Sauce Poivre Vert & Frites", qty: 3, unitPrice: 28000, unitCost: 9500 },
      { menuLabel: "Poulet Fermier Grillé & Purée Maison", qty: 1, unitPrice: 25000, unitCost: 8200 },
      { menuLabel: "Bouteille Vin Rouge d'Alsace 75cl", qty: 1, unitPrice: 55000, unitCost: 35000 },
      { menuLabel: "Eau Vive 1.5L Fraîche", qty: 2, unitPrice: 3500, unitCost: 1400 },
      { menuLabel: "Café Expresso Pur Arabica", qty: 4, unitPrice: 4000, unitCost: 1200 },
    ],
    // Combo 6 : Pause Bar & Dégustation
    [
      { menuLabel: "Bouteille Vin Rouge d'Alsace 75cl", qty: 1, unitPrice: 55000, unitCost: 35000 },
      { menuLabel: "Salade Fraîcheur Tomates & Mozzarella", qty: 2, unitPrice: 15000, unitCost: 4800 },
    ],
    // Combo 7 : Déjeuner rapide solo
    [
      { menuLabel: "Pizza Margherita au Feu de Bois", qty: 1, unitPrice: 22000, unitCost: 6500 },
      { menuLabel: "Coca-Cola Frais 33cl", qty: 1, unitPrice: 4500, unitCost: 2200 },
    ],
    // Combo 8 : Dîner romantique
    [
      { menuLabel: "Steak de Zébu Sauce Poivre Vert & Frites", qty: 1, unitPrice: 28000, unitCost: 9500 },
      { menuLabel: "Romazava Traditionnel Royal & Riz Blanc", qty: 1, unitPrice: 24000, unitCost: 7800 },
      { menuLabel: "Bouteille Vin Rouge d'Alsace 75cl", qty: 1, unitPrice: 55000, unitCost: 35000 },
      { menuLabel: "Café Expresso Pur Arabica", qty: 2, unitPrice: 4000, unitCost: 1200 },
    ],
    // Combo 9 : Déjeuner Burger & THB
    [
      { menuLabel: "Burger Gourmet Sooatel au Steak de Zébu", qty: 2, unitPrice: 32000, unitCost: 11165 },
      { menuLabel: "Bière THB Pilsener Fraîche 65cl", qty: 2, unitPrice: 6000, unitCost: 3600 },
    ],
  ];

  const paymentOptions = [
    "Espèces",
    "Espèces",
    "Carte Bancaire",
    "Mobile Money - Mvola",
    "Mobile Money - Orange Money",
  ];

  const salersList = [waiterId, waiterId, barmanId, employeesMap["manager"]];
  const roomKeys = ["CH-101", "CH-102", "CH-103", "CH-201", "CH-202"];

  // Generate historical sales across the past 60 days
  const today = new Date();
  for (let dayOffset = 60; dayOffset >= 1; dayOffset--) {
    const curDate = new Date(today);
    curDate.setDate(curDate.getDate() - dayOffset);
    const dayOfWeek = curDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
    const numSales = isWeekend ? Math.floor(Math.random() * 2) + 4 : Math.floor(Math.random() * 2) + 2;

    const yyyy = curDate.getFullYear();
    const mm = String(curDate.getMonth() + 1).padStart(2, "0");
    const dd = String(curDate.getDate()).padStart(2, "0");

    for (let s = 0; s < numSales; s++) {
      let hour = 12;
      let min = 15;
      if (s === 0) {
        hour = 12 + Math.floor(Math.random() * 2);
        min = Math.floor(Math.random() * 50);
      } else if (s === 1) {
        hour = 19 + Math.floor(Math.random() * 3);
        min = Math.floor(Math.random() * 50);
      } else if (s === 2) {
        hour = Math.random() > 0.5 ? 13 : 20;
        min = Math.floor(Math.random() * 50);
      } else if (s === 3) {
        hour = 16 + Math.floor(Math.random() * 2);
        min = Math.floor(Math.random() * 50);
      } else {
        hour = 21;
        min = 10 + Math.floor(Math.random() * 40);
      }

      const hhStr = String(hour).padStart(2, "0");
      const minStr = String(min).padStart(2, "0");
      const saleDateStr = yyyy + "-" + mm + "-" + dd + " " + hhStr + ":" + minStr + ":00+03";

      const comboIndex = (dayOffset * 3 + s) % mealCombos.length;
      const baseCombo = mealCombos[comboIndex];
      if (!baseCombo) continue;
      const items = baseCombo.map((it) => ({
        ...it,
        qty: Math.max(1, it.qty + (Math.random() > 0.7 ? 1 : 0)),
      }));

      const saler = salersList[(dayOffset + s) % salersList.length] || waiterId;
      const tableNumber = (s * 3 + dayOffset) % 12 + 1;

      const isRoom = (dayOffset * 7 + s) % 10 === 0;
      const roomKey = roomKeys[(dayOffset + s) % roomKeys.length] || "CH-101";
      const roomId = isRoom ? roomsMap[roomKey] : undefined;
      const pm = isRoom ? "Facturation sur Chambre" : (paymentOptions[(dayOffset + s) % paymentOptions.length] || "Espèces");

      await createClosedSale(saleDateStr, tableNumber, saler, items, pm, roomId);
    }
  }

  // --- Today's closed lunch sales (Day 0) ---
  const todayYyyy = today.getFullYear();
  const todayMm = String(today.getMonth() + 1).padStart(2, "0");
  const todayDd = String(today.getDate()).padStart(2, "0");
  const todayDateStr = todayYyyy + "-" + todayMm + "-" + todayDd;

  await createClosedSale(
    todayDateStr + " 12:30:00+03",
    4,
    waiterId,
    [
      { menuLabel: "Steak de Zébu Sauce Poivre Vert & Frites", qty: 2, unitPrice: 28000, unitCost: 8715 },
      { menuLabel: "Bière THB Pilsener Fraîche 65cl", qty: 2, unitPrice: 6000, unitCost: 3600 },
      { menuLabel: "Café Expresso Pur Arabica", qty: 2, unitPrice: 4000, unitCost: 420 },
    ],
    "Espèces"
  );

  await createClosedSale(
    todayDateStr + " 13:15:00+03",
    2,
    waiterId,
    [
      { menuLabel: "Romazava Traditionnel Royal & Riz Blanc", qty: 1, unitPrice: 24000, unitCost: 5760 },
      { menuLabel: "Pizza Margherita au Feu de Bois", qty: 1, unitPrice: 22000, unitCost: 6670 },
      { menuLabel: "Coca-Cola Frais 33cl", qty: 2, unitPrice: 4500, unitCost: 2200 },
    ],
    "Mobile Money - Mvola"
  );

  // --- Active Open Sales TODAY (status 5 = open) for POS testing ---
  const now = new Date();
  const nowStr = now.toISOString();

  // Commande Table 3 (Ouverte) : 1 Pizza Margherita + 1 THB
  const openSale1Amount = 22000 + 6000;
  const invOpen1 = await client.query(
    `INSERT INTO invoice (invoice_date, total_amount, balance_due, status, created_at, created_by)
     VALUES ($1, $2, $2, 5, $1, $3) RETURNING id_invoice`,
    [nowStr, openSale1Amount, creatorUserId]
  );
  const invOpen1Id = invOpen1.rows[0].id_invoice as string;

  const saleOpen1 = await client.query(
    `INSERT INTO sales (total_amount, table_number, charge_to_room, id_saler, status, created_at, created_by, id_invoice, sale_date)
     VALUES ($1, 3, false, $2, 5, $3, $4, $5, $3) RETURNING id_sale`,
    [openSale1Amount, waiterId, nowStr, creatorUserId, invOpen1Id]
  );
  const saleOpen1Id = saleOpen1.rows[0].id_sale as string;

  await client.query(
    `INSERT INTO sale_items (id_menu, id_sale, quantity, unit_price, total_amount, unit_cost)
     VALUES ($1, $2, 1, 22000, 22000, 6500)`,
    [menuItemsMap["Pizza Margherita au Feu de Bois"], saleOpen1Id]
  );
  await client.query(
    `INSERT INTO sale_items (id_menu, id_sale, quantity, unit_price, total_amount, unit_cost)
     VALUES ($1, $2, 1, 6000, 6000, 3600)`,
    [menuItemsMap["Bière THB Pilsener Fraîche 65cl"], saleOpen1Id]
  );

  // Commande Table 5 (Ouverte) : 2 Steaks de zébu + 2 Eau Vive
  const openSale2Amount = 2 * 28000 + 2 * 3500;
  const invOpen2 = await client.query(
    `INSERT INTO invoice (invoice_date, total_amount, balance_due, status, created_at, created_by)
     VALUES ($1, $2, $2, 5, $1, $3) RETURNING id_invoice`,
    [nowStr, openSale2Amount, creatorUserId]
  );
  const invOpen2Id = invOpen2.rows[0].id_invoice as string;

  const saleOpen2 = await client.query(
    `INSERT INTO sales (total_amount, table_number, charge_to_room, id_saler, status, created_at, created_by, id_invoice, sale_date)
     VALUES ($1, 5, false, $2, 5, $3, $4, $5, $3) RETURNING id_sale`,
    [openSale2Amount, waiterId, nowStr, creatorUserId, invOpen2Id]
  );
  const saleOpen2Id = saleOpen2.rows[0].id_sale as string;

  await client.query(
    `INSERT INTO sale_items (id_menu, id_sale, quantity, unit_price, total_amount, unit_cost)
     VALUES ($1, $2, 2, 28000, 56000, 9500)`,
    [menuItemsMap["Steak de Zébu Sauce Poivre Vert & Frites"], saleOpen2Id]
  );
  await client.query(
    `INSERT INTO sale_items (id_menu, id_sale, quantity, unit_price, total_amount, unit_cost)
     VALUES ($1, $2, 2, 3500, 7000, 1400)`,
    [menuItemsMap["Eau Vive 1.5L Fraîche"], saleOpen2Id]
  );
}

/**
 * Main seeding orchestrator
 */
async function runSeed(): Promise<void> {
  const pool = createPool();
  const client = await pool.connect();

  console.log("=================================================");
  console.log("🚀 Lancement du Seed des données de test Sooatel");
  console.log("=================================================");

  try {
    await client.query("BEGIN");

    // 1. Initial check & preservation
    const { malalaUserId, malalaEmpId, roles } = await getInitialContext(client);
    console.log(`👤 Utilisateur préservé : malalni04 (User ID: ${malalaUserId}, Employee ID: ${malalaEmpId})`);

    // 2. Clean existing records (preserving malalni04, permissions, roles, chatbot chunks)
    await cleanExistingData(client, malalaUserId, malalaEmpId);

    // 3. Seed HR and Staff
    const employeesMap = await seedHR(client, malalaEmpId);

    // 4. Seed Test Users
    const usersMap = await seedUsers(client, malalaUserId, employeesMap, roles);

    // 5. Seed Shifts & Planning
    await seedShiftsAndSchedules(client, employeesMap);

    // 6. Seed Leaves
    await seedLeaves(client, employeesMap);

    // 7. Seed Hotel (Rooms & Room Types)
    const roomsMap = await seedHotel(client);

    // 8. Seed Hotel/Restaurant Events & Seasons
    await seedEvents(client);

    // 9. Seed Inventory & Raw materials
    const itemsMap = await seedInventory(client);

    // 10. Seed Payment Methods & Cash Register
    const { paymentMethods, journalId } = await seedPaymentMethodsAndCash(client, employeesMap);

    // 11. Seed Suppliers, Catalog & Deliveries
    await seedSuppliersAndPurchases(client, itemsMap, employeesMap, paymentMethods);

    // 12. Seed Stock Movements (History & Drafts)
    await seedStockMovements(client, itemsMap, employeesMap);

    // 13. Seed Menu & Recipes (Fiches techniques)
    const menuItemsMap = await seedMenuAndRecipes(client, itemsMap);

    // 13.b Seed Dish Productions
    await seedDishProductions(client, itemsMap, employeesMap);

    // 14. Seed Sales & POS
    await seedSalesAndPOS(client, employeesMap, usersMap, menuItemsMap, roomsMap, paymentMethods);

    await client.query("COMMIT");

    console.log("=================================================");
    console.log("✅ SEED TERMINÉ AVEC SUCCÈS !");
    console.log("=================================================");
    console.log("Comptes utilisateurs disponibles pour vos tests :");
    console.log(" - malalani04      : Admin système (mot de passe préservé)");
    console.log(" - manager.test    : Manager restaurant (mot de passe: Password123!)");
    console.log(" - chef.test       : Chef cuisinier (mot de passe: Password123!)");
    console.log(" - serveur.test    : Serveur / Caissier (mot de passe: Password123!)");
    console.log(" - reception.test  : Réception hôtel (mot de passe: Password123!)");
    console.log("=================================================");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ ERREUR LORS DU SEED, ROLLBACK EFFECTUÉ :", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed();
