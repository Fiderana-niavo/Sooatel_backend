import "reflect-metadata";
import AppDataSource from "../src/database/data-source";

async function run() {
  try {
    await AppDataSource.initialize();
    console.log("Connecté à la base de données.");

    console.log("Mise à jour de la table Permission...");
    
    // Check if column exists before renaming
    const columns = await AppDataSource.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='permission' and column_name='permission_name';
    `);

    if (columns.length > 0) {
      await AppDataSource.query(`ALTER TABLE permission RENAME COLUMN permission_name TO code;`);
      console.log("Colonne permission_name renommée en code.");
    }

    const nameColumns = await AppDataSource.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='permission' and column_name='name';
    `);

    if (nameColumns.length === 0) {
      await AppDataSource.query(`ALTER TABLE permission ADD COLUMN name VARCHAR(100);`);
      await AppDataSource.query(`UPDATE permission SET name = code;`);
      await AppDataSource.query(`ALTER TABLE permission ALTER COLUMN name SET NOT NULL;`);
      console.log("Colonne name ajoutée et remplie avec succès.");
    }

    console.log("Mise à jour de la base de données terminée !");
  } catch (err) {
    console.error("Erreur lors de la mise à jour:", err);
  } finally {
    await AppDataSource.destroy();
  }
}

run();
