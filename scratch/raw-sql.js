const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function updateDb() {
  try {
    await client.connect();
    console.log("Connecté à PostgreSQL.");
    
    // Check if code column exists
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='permission' and column_name='code';
    `);

    if (res.rowCount === 0) {
      console.log("Mise à jour de la table permission...");
      await client.query("ALTER TABLE permission RENAME COLUMN permission_name TO code;");
      await client.query("ALTER TABLE permission ADD COLUMN name VARCHAR(100);");
      await client.query("UPDATE permission SET name = code;");
      await client.query("ALTER TABLE permission ALTER COLUMN name SET NOT NULL;");
      console.log("Base de données mise à jour avec succès !");
    } else {
      console.log("La colonne 'code' existe déjà.");
    }
  } catch (err) {
    console.error("Erreur SQL:", err.message);
  } finally {
    await client.end();
  }
}

updateDb();
