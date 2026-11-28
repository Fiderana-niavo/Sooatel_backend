import { MigrationInterface, QueryRunner } from "typeorm";

interface IdRow {
  id: string;
}

interface ItemSeed {
  label: string;
  type: string;
  unit: string;
  stock: number;
  minimum: number;
  cost: number;
  perishable: boolean;
  supplier?: string;
  category?: string;
  price?: number;
}

interface DishSeed {
  label: string;
  category: string;
  price: number;
  ingredients: { label: string; quantity: number }[];
}

interface OrderSeed {
  daysAgo: number;
  supplier: string;
  lines: { label: string; quantity: number }[];
}

interface SaleSeed {
  daysAgo: number;
  table: number;
  paid: boolean;
  method: string;
  lines: { label: string; quantity: number }[];
}

const DEMO_COMMENT = "Vente de démonstration";
const DEMO_REASON = "Stock initial (démo)";

const MENU_CATEGORIES: { label: string; description: string }[] = [
  { label: "Spécialités Malagasy & Plats Traditionnels", description: "Spécialités malgaches et plats du terroir" },
  { label: "Plats de Zébu & Viandes Rouges", description: "Viandes bovines et grillades de zébu" },
  { label: "Volailles & Plats Mijotés", description: "Volailles fermières et ragoûts mijotés" },
  { label: "Burgers Maison & Snacks", description: "Burgers gourmets, frites et encas rapides" },
  { label: "Boissons Rafraîchissantes & Sodas", description: "Sodas, eaux minérales et jus frais" },
  { label: "Bières Locales & Importées", description: "Bières THB et sélections maltées" },
];

const ITEM_TYPES: { label: string; description: string }[] = [
  { label: "Matière première", description: "Denrées et ingrédients bruts à transformer" },
  { label: "Épicerie sèche & Condiments", description: "Riz, pâtes, farine, sucre, épices, huiles" },
  { label: "Fruits & Légumes frais", description: "Primeurs, légumes maraîchers locaux" },
  { label: "Boucherie & Volailles", description: "Viandes fraîches de zébu, porc, volailles" },
  { label: "Produits laitiers & Fromages", description: "Beurre, fromages, laits, crèmes fraîches" },
  { label: "Boisson non alcoolisée", description: "Jus de fruits naturels, eaux minérales, sodas" },
  { label: "Boisson alcoolisée & Vins", description: "Bières, vins, spiritueux" },
  { label: "Plat cuisiné & Production", description: "Plats et préparations culinaires réalisés sur place" },
];

const SUPPLIERS: { name: string; address: string; phone: string; delay: number }[] = [
  { name: "Boucherie Zébu Antananarivo", address: "Marché d'Analakely, Antananarivo", phone: "034 11 000 11", delay: 1 },
  { name: "Grossiste Tana Distribution", address: "Zone Forello Tanjombato, Antananarivo", phone: "034 12 000 12", delay: 2 },
];

const STOCK_ITEMS: ItemSeed[] = [
  { label: "Filet de zébu", type: "Boucherie & Volailles", unit: "kg", stock: 25, minimum: 5, cost: 18000, perishable: true, supplier: "Boucherie Zébu Antananarivo" },
  { label: "Poulet fermier", type: "Boucherie & Volailles", unit: "kg", stock: 20, minimum: 5, cost: 14000, perishable: true, supplier: "Boucherie Zébu Antananarivo" },
  { label: "Steak haché de zébu", type: "Boucherie & Volailles", unit: "kg", stock: 15, minimum: 4, cost: 22000, perishable: true, supplier: "Boucherie Zébu Antananarivo" },
  { label: "Riz blanc local", type: "Épicerie sèche & Condiments", unit: "kg", stock: 80, minimum: 20, cost: 3500, perishable: false, supplier: "Grossiste Tana Distribution" },
  { label: "Huile de cuisson", type: "Épicerie sèche & Condiments", unit: "L", stock: 20, minimum: 5, cost: 7500, perishable: false, supplier: "Grossiste Tana Distribution" },
  { label: "Pommes de terre", type: "Fruits & Légumes frais", unit: "kg", stock: 40, minimum: 10, cost: 2500, perishable: true, supplier: "Grossiste Tana Distribution" },
  { label: "Tomates fraîches", type: "Fruits & Légumes frais", unit: "kg", stock: 15, minimum: 5, cost: 3000, perishable: true, supplier: "Grossiste Tana Distribution" },
  { label: "Oignons", type: "Fruits & Légumes frais", unit: "kg", stock: 12, minimum: 4, cost: 2800, perishable: true, supplier: "Grossiste Tana Distribution" },
  { label: "Brèdes mafana", type: "Fruits & Légumes frais", unit: "kg", stock: 8, minimum: 3, cost: 4000, perishable: true, supplier: "Grossiste Tana Distribution" },
  { label: "Pain à burger", type: "Matière première", unit: "pc", stock: 60, minimum: 15, cost: 1200, perishable: true, supplier: "Grossiste Tana Distribution" },
  { label: "Fromage cheddar", type: "Produits laitiers & Fromages", unit: "kg", stock: 5, minimum: 2, cost: 15000, perishable: true, supplier: "Grossiste Tana Distribution" },
  { label: "Eau minérale 50cl", type: "Boisson non alcoolisée", unit: "btl", stock: 120, minimum: 30, cost: 1000, perishable: false, supplier: "Grossiste Tana Distribution", category: "Boissons Rafraîchissantes & Sodas", price: 2500 },
  { label: "Coca-Cola 33cl", type: "Boisson non alcoolisée", unit: "can", stock: 96, minimum: 24, cost: 1800, perishable: false, supplier: "Grossiste Tana Distribution", category: "Boissons Rafraîchissantes & Sodas", price: 4000 },
  { label: "Bière THB 65cl", type: "Boisson alcoolisée & Vins", unit: "btl", stock: 72, minimum: 24, cost: 3500, perishable: false, supplier: "Grossiste Tana Distribution", category: "Bières Locales & Importées", price: 7000 },
];

const DISHES: DishSeed[] = [
  {
    label: "Romazava Traditionnel & Riz Blanc",
    category: "Spécialités Malagasy & Plats Traditionnels",
    price: 18000,
    ingredients: [
      { label: "Filet de zébu", quantity: 0.2 },
      { label: "Brèdes mafana", quantity: 0.15 },
      { label: "Tomates fraîches", quantity: 0.05 },
      { label: "Oignons", quantity: 0.03 },
      { label: "Riz blanc local", quantity: 0.2 },
      { label: "Huile de cuisson", quantity: 0.02 },
    ],
  },
  {
    label: "Steak de Zébu & Frites Maison",
    category: "Plats de Zébu & Viandes Rouges",
    price: 28000,
    ingredients: [
      { label: "Filet de zébu", quantity: 0.25 },
      { label: "Pommes de terre", quantity: 0.3 },
      { label: "Huile de cuisson", quantity: 0.1 },
    ],
  },
  {
    label: "Poulet Sauce Tomate & Riz",
    category: "Volailles & Plats Mijotés",
    price: 22000,
    ingredients: [
      { label: "Poulet fermier", quantity: 0.35 },
      { label: "Tomates fraîches", quantity: 0.1 },
      { label: "Oignons", quantity: 0.05 },
      { label: "Riz blanc local", quantity: 0.2 },
      { label: "Huile de cuisson", quantity: 0.03 },
    ],
  },
  {
    label: "Burger Maison & Frites",
    category: "Burgers Maison & Snacks",
    price: 20000,
    ingredients: [
      { label: "Pain à burger", quantity: 1 },
      { label: "Steak haché de zébu", quantity: 0.15 },
      { label: "Fromage cheddar", quantity: 0.03 },
      { label: "Tomates fraîches", quantity: 0.03 },
      { label: "Pommes de terre", quantity: 0.2 },
      { label: "Huile de cuisson", quantity: 0.08 },
    ],
  },
];

const ROOMS: { number: string; type: string; description: string }[] = [
  { number: "CH-101", type: "Chambre Standard Simple", description: "RDC - Standard Vue Patio" },
  { number: "CH-102", type: "Chambre Standard Double", description: "RDC - Standard Côté Cour" },
  { number: "CH-201", type: "Chambre Supérieure King", description: "1er étage - Balcon vue jardin" },
  { number: "CH-301", type: "Suite Junior", description: "2ème étage - Coin salon" },
];

const PURCHASES: OrderSeed[] = [
  {
    daysAgo: 5,
    supplier: "Boucherie Zébu Antananarivo",
    lines: [
      { label: "Filet de zébu", quantity: 15 },
      { label: "Poulet fermier", quantity: 10 },
      { label: "Steak haché de zébu", quantity: 10 },
    ],
  },
  {
    daysAgo: 4,
    supplier: "Grossiste Tana Distribution",
    lines: [
      { label: "Riz blanc local", quantity: 50 },
      { label: "Huile de cuisson", quantity: 20 },
      { label: "Eau minérale 50cl", quantity: 60 },
      { label: "Coca-Cola 33cl", quantity: 48 },
      { label: "Bière THB 65cl", quantity: 48 },
    ],
  },
];

const SALES: SaleSeed[] = [
  {
    daysAgo: 3,
    table: 2,
    paid: true,
    method: "Espèces",
    lines: [
      { label: "Romazava Traditionnel & Riz Blanc", quantity: 2 },
      { label: "Bière THB 65cl", quantity: 2 },
    ],
  },
  {
    daysAgo: 2,
    table: 5,
    paid: true,
    method: "Mobile Money",
    lines: [
      { label: "Steak de Zébu & Frites Maison", quantity: 1 },
      { label: "Coca-Cola 33cl", quantity: 2 },
      { label: "Eau minérale 50cl", quantity: 1 },
    ],
  },
  {
    daysAgo: 1,
    table: 3,
    paid: true,
    method: "Carte Bancaire",
    lines: [
      { label: "Burger Maison & Frites", quantity: 3 },
      { label: "Coca-Cola 33cl", quantity: 3 },
    ],
  },
  {
    daysAgo: 0,
    table: 1,
    paid: false,
    method: "Espèces",
    lines: [
      { label: "Poulet Sauce Tomate & Riz", quantity: 2 },
      { label: "Eau minérale 50cl", quantity: 2 },
    ],
  },
];

async function findId(runner: QueryRunner, sql: string, params: string[]): Promise<string> {
  const rows = (await runner.query(sql, params)) as IdRow[];
  const row = rows[0];
  if (!row) throw new Error(`Seed reference not found: ${params.join(", ")}`);
  return row.id;
}

async function findOperator(runner: QueryRunner, username: string): Promise<string> {
  const rows = (await runner.query(
    `SELECT id_employee AS id FROM users WHERE username = $1`,
    [username],
  )) as IdRow[];
  if (rows[0]) return rows[0].id;
  const fallback = (await runner.query(`SELECT id_employee AS id FROM employees LIMIT 1`)) as IdRow[];
  if (fallback[0]) return fallback[0].id;
  throw new Error(`No employee found for operator: ${username}`);
}

async function findUserId(runner: QueryRunner, username: string): Promise<string> {
  const rows = (await runner.query(
    `SELECT id_user AS id FROM users WHERE username = $1`,
    [username],
  )) as IdRow[];
  if (rows[0]) return rows[0].id;
  const fallback = (await runner.query(`SELECT id_user AS id FROM users LIMIT 1`)) as IdRow[];
  if (fallback[0]) return fallback[0].id;
  throw new Error(`No user found for: ${username}`);
}

async function seedCategories(runner: QueryRunner): Promise<void> {
  for (const cat of MENU_CATEGORIES) {
    await runner.query(
      `INSERT INTO menu_categories (label, description)
       SELECT $1::varchar, $2::varchar
       WHERE NOT EXISTS (SELECT 1 FROM menu_categories WHERE label = $1::varchar)`,
      [cat.label, cat.description],
    );
  }
}

async function seedItemTypes(runner: QueryRunner): Promise<void> {
  for (const type of ITEM_TYPES) {
    await runner.query(
      `INSERT INTO item_type (label, description)
       SELECT $1::varchar, $2::varchar
       WHERE NOT EXISTS (SELECT 1 FROM item_type WHERE label = $1::varchar)`,
      [type.label, type.description],
    );
  }
}

async function seedSuppliers(runner: QueryRunner): Promise<void> {
  for (const supplier of SUPPLIERS) {
    await runner.query(
      `INSERT INTO supplier (name, address, phone_number, provides_delivery, delivery_delay)
       SELECT $1::varchar, $2::varchar, $3::varchar, true, $4::numeric
       WHERE NOT EXISTS (SELECT 1 FROM supplier WHERE name = $1::varchar)`,
      [supplier.name, supplier.address, supplier.phone, supplier.delay],
    );
  }
}

async function insertItem(runner: QueryRunner, item: ItemSeed): Promise<void> {
  await runner.query(
    `INSERT INTO items (label, is_produced, quantity, minimum_stock_level, reorder_quantity, is_perishable, status, id_product_type, id_unit, weighted_average_cost)
     VALUES ($1, false, $2, $3, $4, $5, 1,
       COALESCE((SELECT id_product_type FROM item_type WHERE label = $6 LIMIT 1), (SELECT id_product_type FROM item_type LIMIT 1)),
       COALESCE((SELECT id_unit FROM unit_of_measure WHERE symbol = $7 LIMIT 1), (SELECT id_unit FROM unit_of_measure LIMIT 1)), $8)
     ON CONFLICT (label) DO NOTHING`,
    [item.label, item.stock, item.minimum, item.minimum * 2, item.perishable, item.type, item.unit, item.cost],
  );
}

async function linkSupplier(runner: QueryRunner, item: ItemSeed): Promise<void> {
  if (!item.supplier) return;
  const supplierId = await findId(runner, `SELECT id_supplier AS id FROM supplier WHERE name = $1`, [item.supplier]);
  const itemId = await findId(runner, `SELECT id_item AS id FROM items WHERE label = $1`, [item.label]);
  await runner.query(
    `INSERT INTO supplier_products (name, actual_price, min_purchase_number, id_supplier)
     SELECT $1::varchar, $2::numeric, 1::numeric, $3::uuid
     WHERE NOT EXISTS (SELECT 1 FROM supplier_products WHERE name = $1::varchar AND id_supplier = $3::uuid)`,
    [item.label.slice(0, 50), item.cost, supplierId],
  );
  const productId = await findId(
    runner,
    `SELECT id_supplier_product AS id FROM supplier_products WHERE name = $1 AND id_supplier = $2`,
    [item.label.slice(0, 50), supplierId],
  );
  await runner.query(
    `INSERT INTO supplied_items (id_item, id_supplier_product)
     SELECT $1::uuid, $2::uuid
     WHERE NOT EXISTS (SELECT 1 FROM supplied_items WHERE id_item = $1::uuid AND id_supplier_product = $2::uuid)`,
    [itemId, productId],
  );
}

async function recordStock(runner: QueryRunner, item: ItemSeed, operatorId: string): Promise<void> {
  const itemId = await findId(runner, `SELECT id_item AS id FROM items WHERE label = $1`, [item.label]);
  await runner.query(
    `INSERT INTO stock_movement (id_item, quantity, movement_type, direction, reason, status, id_operator)
     SELECT $1::uuid, $2::numeric, 1, 5, $3::varchar, 0, $4::uuid
     WHERE NOT EXISTS (SELECT 1 FROM stock_movement WHERE id_item = $1::uuid AND reason = $3::varchar)`,
    [itemId, item.stock, DEMO_REASON, operatorId],
  );
}

async function seedStockItems(runner: QueryRunner, operatorId: string): Promise<void> {
  for (const item of STOCK_ITEMS) {
    await insertItem(runner, item);
    await linkSupplier(runner, item);
    await recordStock(runner, item, operatorId);
  }
}

async function seedBeverageMenu(runner: QueryRunner): Promise<void> {
  for (const item of STOCK_ITEMS.filter((entry) => entry.price)) {
    const itemId = await findId(runner, `SELECT id_item AS id FROM items WHERE label = $1`, [item.label]);
    await runner.query(
      `INSERT INTO menu_items (id_item, sale_price, unit_cost, id_category)
       SELECT $1::uuid, $2::numeric, $3::numeric,
         COALESCE(
           (SELECT id_category FROM menu_categories WHERE label = $4 LIMIT 1),
           (SELECT id_category FROM menu_categories WHERE label ILIKE '%' || $4 || '%' LIMIT 1),
           (SELECT id_category FROM menu_categories LIMIT 1)
         )
       WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE id_item = $1::uuid)`,
      [itemId, item.price, item.cost, item.category],
    );
  }
}

async function createDishItem(runner: QueryRunner, dish: DishSeed): Promise<string> {
  await runner.query(
    `INSERT INTO items (label, is_produced, quantity, minimum_stock_level, reorder_quantity, is_perishable, status, id_product_type, id_unit, weighted_average_cost)
     VALUES ($1, true, 20, 5, 10, true, 1,
       COALESCE((SELECT id_product_type FROM item_type WHERE label = 'Plat cuisiné & Production' LIMIT 1), (SELECT id_product_type FROM item_type LIMIT 1)),
       COALESCE((SELECT id_unit FROM unit_of_measure WHERE symbol = 'portion' LIMIT 1), (SELECT id_unit FROM unit_of_measure LIMIT 1)), 0)
     ON CONFLICT (label) DO NOTHING`,
    [dish.label],
  );
  return findId(runner, `SELECT id_item AS id FROM items WHERE label = $1`, [dish.label]);
}

async function createRecipe(runner: QueryRunner, dish: DishSeed, dishId: string): Promise<void> {
  const existing = (await runner.query(
    `SELECT id_recipe AS id FROM recipes WHERE id_item = $1 AND version = 1`,
    [dishId],
  )) as IdRow[];

  let recipeId: string;
  if (existing.length > 0 && existing[0]) {
    recipeId = existing[0].id;
  } else {
    const rows = (await runner.query(
      `INSERT INTO recipes (yield_quantity, id_item, version, is_active)
       VALUES (1, $1, 1, true)
       RETURNING id_recipe AS id`,
      [dishId],
    )) as IdRow[];
    recipeId = (rows[0] as IdRow).id;
  }

  for (const ingredient of dish.ingredients) {
    const ingredientId = await findId(runner, `SELECT id_item AS id FROM items WHERE label = $1`, [ingredient.label]);
    await runner.query(
      `INSERT INTO recipe_details (quantity, id_ingredient, id_recipe)
       SELECT $1::numeric, $2::uuid, $3::uuid
       WHERE NOT EXISTS (
         SELECT 1 FROM recipe_details WHERE id_recipe = $3::uuid AND id_ingredient = $2::uuid
       )`,
      [ingredient.quantity, ingredientId, recipeId],
    );
  }
  await applyRecipeCost(runner, recipeId, dishId);
}

async function applyRecipeCost(runner: QueryRunner, recipeId: string, dishId: string): Promise<void> {
  await runner.query(
    `UPDATE recipes SET recipe_cost = (
       SELECT COALESCE(SUM(rd.quantity * i.weighted_average_cost), 0)
       FROM recipe_details rd JOIN items i ON i.id_item = rd.id_ingredient
       WHERE rd.id_recipe = $1) / yield_quantity
     WHERE id_recipe = $1`,
    [recipeId],
  );
  await runner.query(
    `UPDATE items SET weighted_average_cost = (SELECT recipe_cost FROM recipes WHERE id_recipe = $1)
     WHERE id_item = $2`,
    [recipeId, dishId],
  );
}

async function createDishMenu(runner: QueryRunner, dish: DishSeed, dishId: string): Promise<void> {
  await runner.query(
    `INSERT INTO menu_items (id_item, sale_price, unit_cost, id_category)
     SELECT $1::uuid, $2::numeric,
       (SELECT recipe_cost FROM recipes WHERE id_item = $1::uuid AND version = 1 LIMIT 1),
       COALESCE(
         (SELECT id_category FROM menu_categories WHERE label = $3 LIMIT 1),
         (SELECT id_category FROM menu_categories WHERE label ILIKE '%' || $3 || '%' LIMIT 1),
         (SELECT id_category FROM menu_categories LIMIT 1)
       )
     WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE id_item = $1::uuid)`,
    [dishId, dish.price, dish.category],
  );
}

async function seedDishes(runner: QueryRunner): Promise<void> {
  for (const dish of DISHES) {
    const dishId = await createDishItem(runner, dish);
    await createRecipe(runner, dish, dishId);
    await createDishMenu(runner, dish, dishId);
  }
}

async function seedRooms(runner: QueryRunner): Promise<void> {
  for (const room of ROOMS) {
    await runner.query(
      `INSERT INTO room (room_number, id_room_type, description)
       VALUES ($1,
         COALESCE(
           (SELECT id_room_type FROM room_type WHERE label = $2 LIMIT 1),
           (SELECT id_room_type FROM room_type WHERE label ILIKE '%' || $2 || '%' LIMIT 1),
           (SELECT id_room_type FROM room_type LIMIT 1)
         ),
         $3)
       ON CONFLICT (room_number) DO NOTHING`,
      [room.number, room.type, room.description],
    );
  }
}

async function seedPurchases(runner: QueryRunner, purchaserId: string): Promise<void> {
  for (const [index, order] of PURCHASES.entries()) {
    const supplierId = await findId(runner, `SELECT id_supplier AS id FROM supplier WHERE name = $1`, [order.supplier]);
    const refTag = `ACH-DEMO-${index + 1}`;
    const existing = (await runner.query(`SELECT 1 FROM purchases WHERE ref = $1`, [refTag])) as unknown[];
    if (existing.length > 0) continue;

    let orderTotal = 0;
    const pricedLines: { suppliedId: string; quantity: number; cost: number }[] = [];

    for (const line of order.lines) {
      const rows = (await runner.query(
        `SELECT si.id_supplied_item AS id, i.weighted_average_cost AS cost
         FROM supplied_items si
         JOIN items i ON i.id_item = si.id_item
         WHERE i.label = $1 LIMIT 1`,
        [line.label],
      )) as { id: string; cost: string }[];
      const row = rows[0];
      if (row) {
        const costNum = Number(row.cost);
        orderTotal += costNum * line.quantity;
        pricedLines.push({ suppliedId: row.id, quantity: line.quantity, cost: costNum });
      }
    }

    const purchaseRows = (await runner.query(
      `INSERT INTO purchases (ref, purchase_date, total_amount, status, lifecycle_status, id_supplier, id_purchaser)
       VALUES ($1, CURRENT_DATE - ($2::int * INTERVAL '1 day'), $3, 0, 5, $4, $5)
       RETURNING id_purchase AS id`,
      [refTag, order.daysAgo, orderTotal, supplierId, purchaserId],
    )) as IdRow[];
    const purchaseId = (purchaseRows[0] as IdRow).id;

    for (const line of pricedLines) {
      await runner.query(
        `INSERT INTO purchase_details (id_purchase, id_supplied_item, quantity, unit_price, total_amount)
         VALUES ($1, $2, $3, $4, $5)`,
        [purchaseId, line.suppliedId, line.quantity, line.cost, line.cost * line.quantity],
      );
    }
  }
}

async function priceLines(runner: QueryRunner, sale: SaleSeed) {
  const priced: { menuId: string; quantity: number; price: number; cost: number }[] = [];
  for (const line of sale.lines) {
    const rows = (await runner.query(
      `SELECT m.id_menu AS id, m.sale_price AS price, COALESCE(m.unit_cost, 0) AS cost
       FROM menu_items m JOIN items i ON i.id_item = m.id_item WHERE i.label = $1 LIMIT 1`,
      [line.label],
    )) as { id: string; price: string; cost: string }[];
    const row = rows[0];
    if (!row) throw new Error(`Menu item not found: ${line.label}`);
    priced.push({ menuId: row.id, quantity: line.quantity, price: Number(row.price), cost: Number(row.cost) });
  }
  return priced;
}

async function insertSale(runner: QueryRunner, sale: SaleSeed, index: number, cashierId: string, userId: string): Promise<void> {
  const comment = `${DEMO_COMMENT} n°${index + 1}`;
  const existing = (await runner.query(`SELECT 1 FROM sales WHERE comment = $1`, [comment])) as unknown[];
  if (existing.length > 0) return;

  const lines = await priceLines(runner, sale);
  const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const status = sale.paid ? 0 : 5;

  const invoice = (await runner.query(
    `INSERT INTO invoice (invoice_date, total_amount, balance_due, status, created_by)
     VALUES (NOW() - ($1::int * INTERVAL '1 day'), $2, $3, $4, $5) RETURNING id_invoice AS id`,
    [sale.daysAgo, total, sale.paid ? 0 : total, status, userId],
  )) as IdRow[];
  const invoiceId = (invoice[0] as IdRow).id;

  const saleRows = (await runner.query(
    `INSERT INTO sales (sale_date, total_amount, id_invoice, table_number, id_saler, status, comment, created_by)
     VALUES (NOW() - ($1::int * INTERVAL '1 day'), $2, $3, $4, $5, $6, $7, $8) RETURNING id_sale AS id`,
    [sale.daysAgo, total, invoiceId, sale.table, cashierId, status, comment, userId],
  )) as IdRow[];
  const saleId = (saleRows[0] as IdRow).id;

  for (const line of lines) {
    await runner.query(
      `INSERT INTO sale_items (id_menu, id_sale, quantity, unit_price, unit_cost, total_amount)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [line.menuId, saleId, line.quantity, line.price, line.cost, line.price * line.quantity],
    );
  }
  if (sale.paid) await insertPayment(runner, sale, invoiceId, total);
}

async function insertPayment(runner: QueryRunner, sale: SaleSeed, invoiceId: string, total: number): Promise<void> {
  await runner.query(
    `INSERT INTO payment (id_invoice, payment_date, amount, id_payment_method)
     VALUES ($1, CURRENT_DATE - ($2::int * INTERVAL '1 day'), $3,
       COALESCE(
         (SELECT id_payment_method FROM payment_method WHERE label = $4 LIMIT 1),
         (SELECT id_payment_method FROM payment_method WHERE label ILIKE '%' || $4 || '%' LIMIT 1),
         (SELECT id_payment_method FROM payment_method LIMIT 1)
       ))`,
    [invoiceId, sale.daysAgo, total, sale.method],
  );
}

async function seedSales(runner: QueryRunner, cashierId: string, userId: string): Promise<void> {
  for (const [index, sale] of SALES.entries()) {
    await insertSale(runner, sale, index, cashierId, userId);
  }
}

export class SeedDemoData1713000000000 implements MigrationInterface {
  name = "SeedDemoData1713000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const managerId = await findOperator(queryRunner, "manager.sooatel");
    const cashierId = await findOperator(queryRunner, "caissier.sooatel");
    const cashierUser = await findUserId(queryRunner, "caissier.sooatel");

    await seedCategories(queryRunner);
    await seedItemTypes(queryRunner);
    await seedSuppliers(queryRunner);
    await seedStockItems(queryRunner, managerId);
    await seedBeverageMenu(queryRunner);
    await seedDishes(queryRunner);
    await seedRooms(queryRunner);
    await seedPurchases(queryRunner, managerId);
    await seedSales(queryRunner, cashierId, cashierUser);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM invoice WHERE id_invoice IN (SELECT id_invoice FROM sales WHERE comment LIKE $1)`,
      [`${DEMO_COMMENT}%`],
    );
    await queryRunner.query(`DELETE FROM sales WHERE comment LIKE $1`, [`${DEMO_COMMENT}%`]);
    await queryRunner.query(`DELETE FROM purchases WHERE ref LIKE 'ACH-DEMO-%'`);
  }
}
