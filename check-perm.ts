import AppDataSource from "./src/database/data-source";

async function run() {
  await AppDataSource.initialize();
  const users = await AppDataSource.query(`
    SELECT DISTINCT u.username 
    FROM users u
    LEFT JOIN user_permissions up ON u.id_user = up.id_user
    LEFT JOIN permissions p1 ON up.id_permission = p1.id_permission
    LEFT JOIN user_roles ur ON u.id_user = ur.id_user
    LEFT JOIN role_permissions rp ON ur.id_role = rp.id_role
    LEFT JOIN permissions p2 ON rp.id_permission = p2.id_permission
    WHERE p1.code = 'sales.pos' OR p2.code = 'sales.pos'
  `);
  console.log('Users with sales.pos:', users);
  process.exit(0);
}
run().catch(console.error);
