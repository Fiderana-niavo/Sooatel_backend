const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:root@localhost:5432/sooatel' });
client.connect().then(async () => {
  try {
    const res = await client.query(\SELECT p.ref, pd.id_supplied_item, pd.quantity as purchase_qty FROM purchases p JOIN purchase_details pd ON p.id_purchase = pd.id_purchase WHERE p.ref = 'ACH0006'\);
    console.log('PURCHASE QTY:', res.rows);
    const del = await client.query(\SELECT dd.id_supplied_item, dd.quantity as delivery_qty FROM purchase_delivery pd JOIN product_delivery d ON pd.id_delivery = d.id_delivery JOIN delivery_details dd ON dd.id_delivery = d.id_delivery JOIN purchases p ON p.id_purchase = pd.id_purchase WHERE p.ref = 'ACH0006' AND d.status = 0\);
    console.log('DELIVERY QTY:', del.rows);
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}).catch(console.error);
