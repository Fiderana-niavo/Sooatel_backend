const { Client } = require('pg');

const client = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/sooatel' });

async function run() {
  await client.connect();
  try {
    const res = await client.query("SELECT p.id_purchase, pd.id_supplied_item, pd.quantity as purchase_qty FROM purchases p LEFT JOIN purchase_details pd ON p.id_purchase = pd.id_purchase WHERE p.ref = 'ACH0006'");
    console.log('--- PURCHASE DETAILS ---');
    console.table(res.rows);
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}

run();
