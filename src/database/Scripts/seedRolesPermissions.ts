import "reflect-metadata";
import AppDataSource from "../data-source";
import { Permission } from "../Entities/Permission";
import { PermissionCategory } from "../Entities/PermissionCategory";
import { Role } from "../Entities/Role";
import { RolePermission } from "../Entities/RolePermission";
import { User } from "../Entities/User";
import { UserRole } from "../Entities/UserRole";

interface CategoryDef {
  code: string;
  name: string;
}

interface PermissionDef {
  code: string;
  name: string;
  category: string;
  description: string;
}

interface RoleDef {
  label: string;
  description: string;
  permissions: string[];
}

const CATEGORIES: CategoryDef[] = [
  { code: "navigation", name: "Navigation" },
  { code: "restaurant", name: "Restaurant" },
  { code: "logistique", name: "Logistique" },
  { code: "ressources_humaines", name: "Ressources Humaines" },
  { code: "sécurité", name: "Sécurité" },
  { code: "configuration", name: "Configuration" },
];

const PERMISSIONS: PermissionDef[] = [
  // Navigation
  {
    code: "hotel.access",
    name: "Accès au module Hôtel",
    category: "navigation",
    description: "Permet d'accéder au module hôtel",
  },
  {
    code: "restaurant.access",
    name: "Accès au module Restaurant",
    category: "navigation",
    description: "Permet d'accéder au module restaurant",
  },

  // Restaurant & Caisse
  {
    code: "restaurant.pos",
    name: "Caisse & PDV",
    category: "restaurant",
    description: "Accès au point de vente restaurant",
  },
  {
    code: "sales.pos",
    name: "Caisse & Ventes (Voir, Créer, Modifier)",
    category: "restaurant",
    description: "Créer et modifier les commandes et encaissements",
  },
  {
    code: "sale.manage",
    name: "Gérer les ventes (Rouvrir, Annuler, Supprimer)",
    category: "restaurant",
    description: "Gestion avancée des tickets et ventes",
  },
  {
    code: "restaurant.purchases",
    name: "Achats & Dépenses",
    category: "restaurant",
    description: "Suivi des achats de matières premières et dépenses",
  },

  // Logistique & Stocks
  {
    code: "stock.access",
    name: "Accès Inventaire",
    category: "logistique",
    description: "Accès à la gestion des inventaires",
  },
  {
    code: "stock.read",
    name: "Voir les stocks",
    category: "logistique",
    description: "Consulter les niveaux et mouvements de stock",
  },
  {
    code: "stock.manage",
    name: "Gérer les stocks",
    category: "logistique",
    description: "Effectuer des ajustements et réceptions de stock",
  },
  {
    code: "stock.audit",
    name: "Audits & Alertes",
    category: "logistique",
    description: "Consulter les anomalies et audits de stock",
  },
  {
    code: "stock.forecast",
    name: "Prévisions IA",
    category: "logistique",
    description: "Accès aux prédictions de réapprovisionnement IA",
  },
  {
    code: "supplier.manage",
    name: "Gérer les Fournisseurs",
    category: "logistique",
    description: "Créer et administrer la liste des fournisseurs",
  },

  // Ressources Humaines
  {
    code: "hr.access",
    name: "Accès Ressources Humaines",
    category: "ressources_humaines",
    description: "Accès au portail RH et plannings",
  },
  {
    code: "hr.manage",
    name: "Gérer les RH (Postes, Équipes)",
    category: "ressources_humaines",
    description: "Gérer l'organisation, les postes et affectations",
  },
  {
    code: "hr.welfare",
    name: "Bien-être de l'équipe",
    category: "ressources_humaines",
    description: "Suivi des congés et du bien-être du personnel",
  },
  {
    code: "employee.manage",
    name: "Gérer les employés",
    category: "ressources_humaines",
    description: "Créer et modifier les fiches employés",
  },
  {
    code: "employee.delete",
    name: "Supprimer un employé",
    category: "ressources_humaines",
    description: "Désactiver ou supprimer un compte employé",
  },

  // Sécurité & Permissions
  {
    code: "security.access",
    name: "Gestion de la sécurité (Accès, Rôles, Clés)",
    category: "sécurité",
    description: "Accès aux paramètres de sécurité et utilisateurs",
  },
  {
    code: "role.read",
    name: "Voir les rôles",
    category: "sécurité",
    description: "Consulter les profils et rôles existants",
  },
  {
    code: "role.create",
    name: "Créer un rôle",
    category: "sécurité",
    description: "Créer de nouveaux rôles utilisateurs",
  },
  {
    code: "role.update",
    name: "Modifier un rôle",
    category: "sécurité",
    description: "Ajuster les permissions associées à un rôle",
  },
  {
    code: "role.delete",
    name: "Supprimer un rôle",
    category: "sécurité",
    description: "Supprimer un rôle non assigné",
  },
  {
    code: "permission.read",
    name: "Voir les permissions",
    category: "sécurité",
    description: "Consulter la grille complète des permissions",
  },
  {
    code: "permission.create",
    name: "Créer une permission",
    category: "sécurité",
    description: "Ajouter une permission au catalogue",
  },
  {
    code: "permission.update",
    name: "Modifier une permission",
    category: "sécurité",
    description: "Mettre à jour l'intitulé d'une permission",
  },
  {
    code: "permission.delete",
    name: "Supprimer une permission",
    category: "sécurité",
    description: "Retirer une permission obsolète",
  },

  // Configuration
  {
    code: "settings.access",
    name: "Accès Paramètres",
    category: "configuration",
    description: "Consulter et ajuster les paramètres généraux",
  },
  {
    code: "manager.info",
    name: "Gérer les informations de l'entreprise",
    category: "configuration",
    description: "Mettre à jour l'identité et les coordonnées de l'établissement",
  },
];

const ROLES: RoleDef[] = [
  {
    label: "Admin",
    description: "Administrateur système - Accès intégral à tous les modules",
    permissions: PERMISSIONS.map((p) => p.code),
  },
  {
    label: "Manager",
    description: "Responsable d'établissement - Pilotage des ventes, stocks, RH et configuration",
    permissions: [
      "hotel.access",
      "restaurant.access",
      "restaurant.pos",
      "sales.pos",
      "sale.manage",
      "restaurant.purchases",
      "stock.access",
      "stock.read",
      "stock.manage",
      "stock.audit",
      "stock.forecast",
      "supplier.manage",
      "hr.access",
      "hr.manage",
      "hr.welfare",
      "employee.manage",
      "settings.access",
      "manager.info",
      "role.read",
      "permission.read",
    ],
  },
  {
    label: "Chef cuisinier",
    description: "Responsable cuisine - Gestion des stocks, inventaires, fiches recettes et production",
    permissions: [
      "restaurant.access",
      "stock.access",
      "stock.read",
      "stock.manage",
      "stock.audit",
      "stock.forecast",
      "restaurant.purchases",
      "supplier.manage",
    ],
  },
  {
    label: "Caissier",
    description: "Personnel de caisse - Enregistrement des ventes, encaissements et consultation des stocks",
    permissions: [
      "restaurant.access",
      "restaurant.pos",
      "sales.pos",
      "sale.manage",
      "stock.read",
      "stock.manage",
      "supplier.manage",
      "hotel.access",
      "restaurant.purchases",
    ],
  },
  {
    label: "default",
    description: "Profil standard - Accès restreint aux opérations autorisées",
    permissions: ["restaurant.access", "sales.pos", "stock.read"],
  },
];

async function seed(): Promise<void> {
  try {
    await AppDataSource.initialize();
    console.log("Connected to PostgreSQL database.");

    // 1. Seed or ensure Permission Categories
    const categoryMap = new Map<string, string>();
    for (const catDef of CATEGORIES) {
      let category = await AppDataSource.getRepository(PermissionCategory).findOne({
        where: [{ code: catDef.code }, { name: catDef.name }],
      });

      if (!category) {
        category = AppDataSource.getRepository(PermissionCategory).create({
          code: catDef.code,
          name: catDef.name,
        });
        await AppDataSource.getRepository(PermissionCategory).save(category);
        console.log(`[Category] Created: ${catDef.name} (${catDef.code})`);
      }
      categoryMap.set(catDef.code, category.idCategory);
    }

    // 2. Seed or ensure Permissions
    const permissionMap = new Map<string, Permission>();
    for (const permDef of PERMISSIONS) {
      let permission = await AppDataSource.getRepository(Permission).findOne({
        where: { code: permDef.code },
      });

      const categoryId = categoryMap.get(permDef.category);
      if (!permission) {
        permission = AppDataSource.getRepository(Permission).create({
          code: permDef.code,
          name: permDef.name,
          description: permDef.description,
          idCategory: categoryId,
        });
        await AppDataSource.getRepository(Permission).save(permission);
        console.log(`[Permission] Created: ${permDef.code}`);
      } else {
        // Update name or description if needed
        let updated = false;
        if (categoryId && permission.idCategory !== categoryId) {
          permission.idCategory = categoryId;
          updated = true;
        }
        if (updated) {
          await AppDataSource.getRepository(Permission).save(permission);
        }
      }
      permissionMap.set(permDef.code, permission);
    }

    // 3. Seed or ensure Roles
    for (const roleDef of ROLES) {
      let role = await AppDataSource.getRepository(Role).findOne({
        where: { label: roleDef.label },
      });

      if (!role) {
        role = AppDataSource.getRepository(Role).create({
          label: roleDef.label,
          description: roleDef.description,
        });
        await AppDataSource.getRepository(Role).save(role);
        console.log(`[Role] Created: ${roleDef.label}`);
      }

      // 4. Assign permissions to role
      let assignedCount = 0;
      for (const permCode of roleDef.permissions) {
        const permission = permissionMap.get(permCode);
        if (!permission) continue;

        const rolePermExists = await AppDataSource.getRepository(RolePermission).findOne({
          where: {
            idRole: role.idRole,
            idPermission: permission.idPermission,
          },
        });

        if (!rolePermExists) {
          const rolePerm = AppDataSource.getRepository(RolePermission).create({
            idRole: role.idRole,
            idPermission: permission.idPermission,
          });
          await AppDataSource.getRepository(RolePermission).save(rolePerm);
          assignedCount++;
        }
      }

      if (assignedCount > 0) {
        console.log(`[RolePermission] Assigned ${assignedCount} new permissions to ${roleDef.label}`);
      }
    }

    // 5. Ensure Admin role for administrative users if they exist
    const adminRole = await AppDataSource.getRepository(Role).findOne({
      where: { label: "Admin" },
    });

    if (adminRole) {
      const adminUsers = await AppDataSource.getRepository(User)
        .createQueryBuilder("u")
        .where("u.username IN (:...names)", {
          names: ["malalani04", "malala.niriana", "fiderana.niavo", "sarobidiniaina.fiderana"],
        })
        .getMany();

      for (const user of adminUsers) {
        const hasAdmin = await AppDataSource.getRepository(UserRole).findOne({
          where: { idUser: user.idUser, idRole: adminRole.idRole },
        });

        if (!hasAdmin) {
          const userRole = AppDataSource.getRepository(UserRole).create({
            idUser: user.idUser,
            idRole: adminRole.idRole,
          });
          await AppDataSource.getRepository(UserRole).save(userRole);
          console.log(`[UserRole] Assigned Admin role to user ${user.username}`);
        }
      }
    }

    console.log("Roles and permissions seed completed successfully.");
  } catch (error) {
    console.error("Seed execution failed:", error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

seed();
