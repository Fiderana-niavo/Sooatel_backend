import { MigrationInterface, QueryRunner } from "typeorm";
import bcrypt from "bcrypt";

interface UserSeed {
  username: string;
  name: string;
  lastname: string;
  email: string;
  phone: string;
  role: string;
}

interface RoleRow {
  id_role: string;
}

interface EmployeeRow {
  id_employee: string;
}

interface UserRow {
  id_user: string;
  id_employee?: string;
}

const DEFAULT_PASSWORD = "Password123!";

const USERS_LIST: UserSeed[] = [
  {
    username: "admin.sooatel",
    name: "Malala",
    lastname: "Andrianarivo",
    email: "admin@sooatel.mg",
    phone: "034 01 000 01",
    role: "Admin",
  },
  {
    username: "manager.sooatel",
    name: "Jean",
    lastname: "Rabe",
    email: "manager@sooatel.mg",
    phone: "034 02 000 02",
    role: "Manager",
  },
  {
    username: "chef.sooatel",
    name: "Faly",
    lastname: "Rakoto",
    email: "chef@sooatel.mg",
    phone: "034 03 000 03",
    role: "Chef cuisinier",
  },
  {
    username: "caissier.sooatel",
    name: "Soa",
    lastname: "Razafy",
    email: "caisse@sooatel.mg",
    phone: "034 04 000 04",
    role: "Caissier",
  },
  {
    username: "serveur.sooatel",
    name: "Niavo",
    lastname: "Randria",
    email: "serveur@sooatel.mg",
    phone: "034 06 000 06",
    role: "default",
  },
];

export class SeedInitialUsers1712000000000 implements MigrationInterface {
  name = "SeedInitialUsers1712000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    for (const userConfig of USERS_LIST) {
      // 1. Find or create employee
      const employeeRows = (await queryRunner.query(
        `SELECT id_employee FROM employees WHERE email_contact = $1`,
        [userConfig.email]
      )) as EmployeeRow[];

      let employeeId: string;
      const existingEmployee = employeeRows[0];
      if (!existingEmployee) {
        const insertedEmployees = (await queryRunner.query(
          `INSERT INTO employees (name, lastname, email_contact, phone_number, active_status)
           VALUES ($1, $2, $3, $4, 1)
           RETURNING id_employee`,
          [userConfig.name, userConfig.lastname, userConfig.email, userConfig.phone]
        )) as EmployeeRow[];
        const firstEmployee = insertedEmployees[0];
        if (!firstEmployee) continue;
        employeeId = firstEmployee.id_employee;
      } else {
        employeeId = existingEmployee.id_employee;
      }

      // 2. Find or create user account
      const userRows = (await queryRunner.query(
        `SELECT id_user FROM users WHERE username = $1`,
        [userConfig.username]
      )) as UserRow[];

      let userId: string;
      const existingUser = userRows[0];
      if (!existingUser) {
        const insertedUsers = (await queryRunner.query(
          `INSERT INTO users (username, password_hash, active_status, created_date, activated_at, activated_from, id_employee)
           VALUES ($1, $2, 1, NOW(), NOW(), NOW(), $3)
           RETURNING id_user`,
          [userConfig.username, passwordHash, employeeId]
        )) as UserRow[];
        const firstUser = insertedUsers[0];
        if (!firstUser) continue;
        userId = firstUser.id_user;
      } else {
        userId = existingUser.id_user;
        await queryRunner.query(
          `UPDATE users SET password_hash = $1, active_status = 1 WHERE id_user = $2`,
          [passwordHash, userId]
        );
      }

      // 3. Link user to the existing role from migration 1
      const roleRows = (await queryRunner.query(
        `SELECT id_role FROM role WHERE label = $1`,
        [userConfig.role]
      )) as RoleRow[];

      const matchedRole = roleRows[0];
      if (matchedRole) {
        await queryRunner.query(
          `INSERT INTO user_role (id_user, id_role)
           SELECT $1, $2
           WHERE NOT EXISTS (
             SELECT 1 FROM user_role WHERE id_user = $1 AND id_role = $2
           )`,
          [userId, matchedRole.id_role]
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const userConfig of USERS_LIST) {
      const userRows = (await queryRunner.query(
        `SELECT id_user, id_employee FROM users WHERE username = $1`,
        [userConfig.username]
      )) as UserRow[];

      const matchedUser = userRows[0];
      if (matchedUser) {
        const userId = matchedUser.id_user;
        const employeeId = matchedUser.id_employee;

        await queryRunner.query(`DELETE FROM user_role WHERE id_user = $1`, [userId]);
        await queryRunner.query(`DELETE FROM users WHERE id_user = $1`, [userId]);
        if (employeeId) {
          await queryRunner.query(`DELETE FROM employees WHERE id_employee = $1`, [employeeId]);
        }
      }
    }
  }
}
