import "reflect-metadata";
import AppDataSource from "../data-source";
import { User } from "../Entities/User";
import { Role } from "../Entities/Role";
import { Permission } from "../Entities/Permission";
import { PermissionCategory } from "../Entities/PermissionCategory";
import { RolePermission } from "../Entities/RolePermission";
import { UserRole } from "../Entities/UserRole";

const PERMISSIONS = [
  { code: "employee.read", name: "Voir les employés", category: "Ressources Humaines" },
  { code: "employee.create", name: "Créer un employé", category: "Ressources Humaines" },
  { code: "employee.update", name: "Modifier un employé", category: "Ressources Humaines" },
  { code: "employee.delete", name: "Supprimer un employé", category: "Ressources Humaines" },
  { code: "job.read", name: "Voir les postes", category: "Ressources Humaines" },
  { code: "job.create", name: "Créer un poste", category: "Ressources Humaines" },
  { code: "job.update", name: "Modifier un poste", category: "Ressources Humaines" },
  { code: "job.delete", name: "Supprimer un poste", category: "Ressources Humaines" },
  { code: "role.read", name: "Voir les rôles", category: "Sécurité" },
  { code: "role.create", name: "Créer un rôle", category: "Sécurité" },
  { code: "role.update", name: "Modifier un rôle", category: "Sécurité" },
  { code: "role.delete", name: "Supprimer un rôle", category: "Sécurité" },
  { code: "permission.read", name: "Voir les permissions", category: "Sécurité" },
  { code: "permission.create", name: "Créer une permission", category: "Sécurité" },
  { code: "permission.update", name: "Modifier une permission", category: "Sécurité" },
  { code: "permission.delete", name: "Supprimer une permission", category: "Sécurité" },
  { code: "security.access", name: "Gestion de la sécurité (Accès, Rôles, Clés)", category: "Sécurité" },
  { code: "hotel.access", name: "Accès au module Hôtel", category: "Navigation" },
  { code: "restaurant.access", name: "Accès au module Restaurant", category: "Navigation" },
  { code: "restaurant.pos", name: "Caisse & PDV", category: "Restaurant" },
  { code: "restaurant.purchases", name: "Achats & Dépenses", category: "Restaurant" },
  { code: "stock.access", name: "Accès Inventaire", category: "Logistique" },
  { code: "stock.read", name: "Voir les stocks", category: "Logistique" },
  { code: "stock.audit", name: "Audits & Alertes", category: "Logistique" },
  { code: "stock.forecast", name: "Prévisions IA", category: "Logistique" },
  { code: "hr.access", name: "Accès Ressources Humaines", category: "Ressources Humaines" },
  { code: "hr.schedule", name: "Plannings", category: "Ressources Humaines" },
  { code: "hr.welfare", name: "Bien-être de l'équipe", category: "Ressources Humaines" },
  { code: "settings.access", name: "Accès Paramètres", category: "Configuration" },
];

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log("Connecté à la base de données.");

    // 1. Create or get categories
    const categoryMap = new Map<string, string>();
    const categories = Array.from(new Set(PERMISSIONS.map(p => p.category)));
    
    for (const catName of categories) {
      let cat = await AppDataSource.getRepository(PermissionCategory).findOne({ where: { name: catName } });
      if (!cat) {
        cat = AppDataSource.getRepository(PermissionCategory).create({ name: catName, code: catName.toLowerCase().replace(/ /g, "_") });
        await AppDataSource.getRepository(PermissionCategory).save(cat);
      }
      categoryMap.set(catName, cat.idCategory);
    }

    // 2. Create or get permissions
    const permissionEntities: Permission[] = [];
    for (const p of PERMISSIONS) {
      let perm = await AppDataSource.getRepository(Permission).findOne({ where: { code: p.code } });
      if (!perm) {
        perm = AppDataSource.getRepository(Permission).create({
          code: p.code,
          name: p.name,
          idCategory: categoryMap.get(p.category),
          description: p.name
        });
        await AppDataSource.getRepository(Permission).save(perm);
        console.log(`Permission créée : ${p.code}`);
      }
      permissionEntities.push(perm);
    }

    // 3. Create Admin role
    let adminRole = await AppDataSource.getRepository(Role).findOne({ where: { label: "Admin" } });
    if (!adminRole) {
      adminRole = AppDataSource.getRepository(Role).create({ label: "Admin", description: "Administrateur système" });
      await AppDataSource.getRepository(Role).save(adminRole);
      console.log("Rôle Admin créé.");
    }

    // 4. Assign all permissions to Admin role
    for (const perm of permissionEntities) {
      const exists = await AppDataSource.getRepository(RolePermission).findOne({
        where: { idRole: adminRole.idRole, idPermission: perm.idPermission }
      });
      if (!exists) {
        const rp = AppDataSource.getRepository(RolePermission).create({
          idRole: adminRole.idRole,
          idPermission: perm.idPermission
        });
        await AppDataSource.getRepository(RolePermission).save(rp);
      }
    }
    console.log("Toutes les permissions ont été assignées au rôle Admin.");

    // 5. Find user Malala
    const users = await AppDataSource.getRepository(User)
      .createQueryBuilder("u")
      .leftJoinAndSelect("u.employee", "e")
      .where("e.name ILIKE :search1 OR e.lastname ILIKE :search1", { search1: "%malala%" })
      .orWhere("u.username ILIKE :search2", { search2: "%malala%" })
      .getMany();

    if (users.length === 0) {
      console.error("Impossible de trouver un utilisateur contenant 'malala' dans son nom, prénom ou username.");
    } else {
      const targetUser = users[0] as User;
      console.log(`Utilisateur trouvé : ${targetUser.employee?.name} ${targetUser.employee?.lastname} (${targetUser.username})`);
      
      // 6. Assign role to user
      const userRoleExists = await AppDataSource.getRepository(UserRole).findOne({
        where: { idUser: targetUser.idUser, idRole: adminRole.idRole }
      });

      if (!userRoleExists) {
        const ur = AppDataSource.getRepository(UserRole).create({
          idUser: targetUser.idUser,
          idRole: adminRole.idRole
        });
        await AppDataSource.getRepository(UserRole).save(ur);
        console.log("Rôle Admin assigné à Malala avec succès !");
      } else {
        console.log("L'utilisateur a déjà le rôle Admin.");
      }
    }

  } catch (err) {
    console.error("Erreur lors du seed:", err);
  } finally {
    await AppDataSource.destroy();
  }
}

seed();
