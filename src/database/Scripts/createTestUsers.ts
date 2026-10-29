import "reflect-metadata";
import bcrypt from "bcrypt";
import AppDataSource from "../data-source";
import { User } from "../Entities/User";
import { Employee } from "../Entities/Employee";
import { Permission } from "../Entities/Permission";
import { UserPermission } from "../Entities/UserPermission";
import { invalidateAllCache } from "../../shared/services/UserPermissionCache";

interface TestUserConfig {
  username: string;
  password: string;
  name: string;
  lastname: string;
  email: string;
  phone: string;
  permissions: string[];
  description: string;
}

const TEST_USERS: TestUserConfig[] = [
  {
    username: "chef.test",
    password: "Password123!",
    name: "Rakoto",
    lastname: "Chef",
    email: "chef.test@sooatel.mg",
    phone: "034 00 000 01",
    permissions: ["restaurant.access", "stock.access", "stock.read", "stock.manage"],
    description:
      "Cuisinier : insertion de productions autorisée, modification d'entreprise refusée.",
  },
  {
    username: "manager.test",
    password: "Password123!",
    name: "Rabe",
    lastname: "Manager",
    email: "manager.test@sooatel.mg",
    phone: "034 00 000 02",
    permissions: [
      "restaurant.access",
      "settings.access",
      "sales.pos",
      "sale.manage",
      "manager.info",
    ],
    description: "Manager : gestion ventes/menus et modification infos entreprise autorisées.",
  },
  {
    username: "serveur.test",
    password: "Password123!",
    name: "Soa",
    lastname: "Serveur",
    email: "serveur.test@sooatel.mg",
    phone: "034 00 000 03",
    permissions: ["restaurant.access", "restaurant.pos", "sales.pos"],
    description: "Serveur : consultation ventes/menus autorisée, aucune écriture possible.",
  },
  {
    username: "stagiaire.test",
    password: "Password123!",
    name: "Koto",
    lastname: "Stagiaire",
    email: "stagiaire.test@sooatel.mg",
    phone: "034 00 000 04",
    permissions: ["restaurant.access"],
    description: "Stagiaire : questions RAG générales uniquement, écritures et analytics refusées.",
  },
];

async function createTestUsers() {
  await AppDataSource.initialize();
  console.log("Connecté à la base de données.");

  const employeeRepo = AppDataSource.getRepository(Employee);
  const userRepo = AppDataSource.getRepository(User);
  const permRepo = AppDataSource.getRepository(Permission);
  const userPermRepo = AppDataSource.getRepository(UserPermission);

  for (const config of TEST_USERS) {
    // 1. Employee sans poste (pas d'EmployeeJob)
    let employee = await employeeRepo.findOne({
      where: { emailContact: config.email },
    });

    if (!employee) {
      employee = employeeRepo.create({
        name: config.name,
        lastname: config.lastname,
        emailContact: config.email,
        phoneNumber: config.phone,
        activeStatus: 1,
        notes: "Utilisateur de test pour le chatbot",
      });
      employee = await employeeRepo.save(employee);
      console.log(`Employé créé : ${employee.name} ${employee.lastname}`);
    } else {
      employee.activeStatus = 1;
      await employeeRepo.save(employee);
    }

    // 2. Utilisateur et son compte
    const passwordHash = await bcrypt.hash(config.password, 12);
    let user = await userRepo.findOne({
      where: { username: config.username },
    });

    if (!user) {
      user = userRepo.create({
        idEmployee: employee.idEmployee,
        username: config.username,
        passwordHash,
        activeStatus: 1,
        activatedAt: new Date(),
        activatedFrom: new Date(),
        createdDate: new Date(),
      });
      user = await userRepo.save(user);
      console.log(`Compte utilisateur créé : ${user.username}`);
    } else {
      user.passwordHash = passwordHash;
      user.activeStatus = 1;
      user.idEmployee = employee.idEmployee;
      user = await userRepo.save(user);
      console.log(`Compte utilisateur mis à jour : ${user.username}`);
    }

    // 3. Permissions directes
    for (const permCode of config.permissions) {
      const perm = await permRepo.findOne({ where: { code: permCode } });
      if (!perm) {
        console.warn(`Permission introuvable en base : "${permCode}"`);
        continue;
      }

      let userPerm = await userPermRepo.findOne({
        where: { idUser: user.idUser, idPermission: perm.idPermission },
      });

      if (!userPerm) {
        userPerm = userPermRepo.create({
          idUser: user.idUser,
          idPermission: perm.idPermission,
          isAllowed: true,
        });
        await userPermRepo.save(userPerm);
      } else if (!userPerm.isAllowed) {
        userPerm.isAllowed = true;
        await userPermRepo.save(userPerm);
      }
    }
  }

  invalidateAllCache();
  console.log("\n✅ Tous les utilisateurs de test ont été initialisés avec succès.\n");

  await AppDataSource.destroy();
}

createTestUsers().catch((err) => {
  console.error("Erreur lors de la création des utilisateurs de test :", err);
  process.exit(1);
});
