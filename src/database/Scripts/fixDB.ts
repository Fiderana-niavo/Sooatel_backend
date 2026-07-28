import AppDataSource from "../data-source";

async function fix() {
  await AppDataSource.initialize();
  
  // 1. Check permission sales.create
  let perms = await AppDataSource.query(`SELECT id_permission FROM permission WHERE code = 'sales.create'`);
  if (!perms.length) {
    let cat = await AppDataSource.query(`SELECT id_category FROM permission_category LIMIT 1`);
    if (!cat.length) {
      await AppDataSource.query(`INSERT INTO permission_category (id_category, name, code) VALUES (gen_random_uuid(), 'Sales', 'sales')`);
      cat = await AppDataSource.query(`SELECT id_category FROM permission_category LIMIT 1`);
    }
    await AppDataSource.query(`INSERT INTO permission (id_permission, name, code, id_category) VALUES (gen_random_uuid(), 'Create Sales', 'sales.create', '${cat[0].id_category}')`);
    perms = await AppDataSource.query(`SELECT id_permission FROM permission WHERE code = 'sales.create'`);
  }
  
  // 2. Assign to malalani04 and fiderana
  const users = await AppDataSource.query(`SELECT id_user, username FROM "users" WHERE username IN ('fiderana', 'malalani04')`);
  
  // Ensure default role exists
  let roles = await AppDataSource.query(`SELECT id_role FROM role WHERE role_name = 'default' LIMIT 1`);
  if (!roles.length) {
      await AppDataSource.query(`INSERT INTO role (id_role, role_name, role_code) VALUES (gen_random_uuid(), 'default', 'default')`);
      roles = await AppDataSource.query(`SELECT id_role FROM role WHERE role_name = 'default' LIMIT 1`);
  }
  
  if (roles.length) {
    for (const user of users) {
       // Using gen_random_uuid() for uuid primary keys
       // But wait, there might not be a unique constraint on (id_user, id_role) without conflict target.
       // So let's check first.
       const ur = await AppDataSource.query(`SELECT id_user_role FROM user_role WHERE id_user = '${user.id_user}' AND id_role = '${roles[0].id_role}'`);
       if (!ur.length) {
           await AppDataSource.query(`INSERT INTO user_role (id_user_role, id_user, id_role) VALUES (gen_random_uuid(), '${user.id_user}', '${roles[0].id_role}')`);
       }
       
       const rp = await AppDataSource.query(`SELECT id_role_permission FROM role_permission WHERE id_role = '${roles[0].id_role}' AND id_permission = '${perms[0].id_permission}'`);
       if (!rp.length) {
           await AppDataSource.query(`INSERT INTO role_permission (id_role_permission, id_role, id_permission) VALUES (gen_random_uuid(), '${roles[0].id_role}', '${perms[0].id_permission}')`);
       }
    }
  }
  console.log("DB Fixed!");
  process.exit(0);
}

fix().catch(console.error);
