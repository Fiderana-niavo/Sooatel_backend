-- =========================================================================
-- SOOATEL ERP — VUES MÉTIER SÉMANTIQUES (POUR ANALYTICS & CHATBOT IA)
-- Fichier : sooatel_vues.sql
-- =========================================================================

-- 1. Vue des vendeurs et caissiers
CREATE OR REPLACE VIEW v_sellers AS
WITH latest_job AS (
  SELECT DISTINCT ON (id_employee)
    id_employee,
    id_job_title,
    assignment_date,
    confirmed_date
  FROM employees_job
  WHERE status IN (0, 5) AND (end_date IS NULL OR end_date > CURRENT_DATE)
  ORDER BY id_employee, assignment_date DESC
)
SELECT 
  e.id_employee,
  e.employee_code,
  CONCAT(e.name, ' ', e.lastname) AS nom_complet,
  COALESCE(jt.title, 'Sans poste') AS poste,
  CASE WHEN jt.title ILIKE ANY(ARRAY['%caiss%', '%serveur%', '%vend%']) THEN true ELSE false END AS is_dedicated_seller,
  lj.assignment_date,
  lj.confirmed_date,
  COUNT(s.id_sale) AS nb_ventes,
  COALESCE(SUM(s.total_amount), 0) AS ca_total,
  COALESCE(ROUND(AVG(s.total_amount), 0), 0) AS panier_moyen,
  MAX(s.sale_date) AS derniere_vente
FROM employees e
LEFT JOIN latest_job lj ON lj.id_employee = e.id_employee
LEFT JOIN job_titles jt ON jt.id_job_title = lj.id_job_title
LEFT JOIN sales s ON s.id_saler = e.id_employee AND s.status != -3
WHERE e.employee_code NOT ILIKE 'EMP-TEST%'
  AND (jt.title ILIKE ANY(ARRAY['%caiss%', '%serveur%', '%vend%']) OR s.id_sale IS NOT NULL)
GROUP BY e.id_employee, e.employee_code, e.name, e.lastname, jt.title, lj.assignment_date, lj.confirmed_date;

-- 2. Vue des ventes par plat et boisson (avec marges et bénéfice brut)
CREATE OR REPLACE VIEW v_menu_sales AS
SELECT 
  mi.id_menu,
  mi.ref AS code_menu,
  i.id_item,
  i.label AS article,
  mc.label AS categorie,
  mi.sale_price AS prix_vente,
  mi.unit_cost AS cout_matiere,
  (mi.sale_price - COALESCE(mi.unit_cost, 0)) AS marge_unitaire,
  CASE 
    WHEN mi.sale_price > 0 AND mi.unit_cost IS NOT NULL 
    THEN ROUND(((mi.sale_price - mi.unit_cost) / mi.sale_price) * 100, 1) 
    ELSE NULL 
  END AS taux_marge_pct,
  COALESCE(SUM(si.quantity), 0) AS quantite_vendue,
  COALESCE(SUM(si.total_amount), 0) AS ca_total,
  CASE 
    WHEN mi.unit_cost IS NOT NULL 
    THEN COALESCE(SUM(si.quantity), 0) * (mi.sale_price - mi.unit_cost) 
    ELSE NULL 
  END AS benefice_brut_total,
  COUNT(DISTINCT si.id_sale) AS nb_commandes,
  MAX(s.sale_date) AS derniere_vente
FROM menu_items mi
JOIN items i ON i.id_item = mi.id_item
JOIN menu_categories mc ON mc.id_category = mi.id_category
LEFT JOIN sale_items si ON si.id_menu = mi.id_menu
LEFT JOIN sales s ON s.id_sale = si.id_sale AND s.status != -3
GROUP BY mi.id_menu, mi.ref, i.id_item, i.label, mc.label, mi.sale_price, mi.unit_cost;

-- 2.b. Vue des recettes et versions de plats
CREATE OR REPLACE VIEW v_recipes AS
SELECT 
  r.id_recipe,
  i.id_item,
  i.label AS article,
  r.version,
  r.is_active,
  r.recipe_cost,
  r.yield_quantity,
  ROUND(r.recipe_cost / NULLIF(r.yield_quantity, 0), 2) AS cout_portion,
  r.created_at
FROM recipes r
JOIN items i ON i.id_item = r.id_item;

-- 2.c. Vue des ingrédients et composition détaillée des recettes
CREATE OR REPLACE VIEW v_recipe_ingredients AS
SELECT 
  rd.id_recipe_detail,
  r.id_recipe,
  i_plat.label AS plat,
  r.version,
  r.is_active,
  i_ing.label AS ingredient,
  rd.quantity,
  COALESCE(uom.symbol, 'U') AS unite
FROM recipe_details rd
JOIN recipes r ON r.id_recipe = rd.id_recipe
JOIN items i_plat ON i_plat.id_item = r.id_item
JOIN items i_ing ON i_ing.id_item = rd.id_ingredient
LEFT JOIN unit_of_measure uom ON uom.id_unit = i_ing.id_unit;

-- 3. Vue des dettes et soldes fournisseurs
CREATE OR REPLACE VIEW v_supplier_debts AS
SELECT 
  s.id_supplier,
  s.ref AS ref_fournisseur,
  s.name AS fournisseur,
  COALESCE(sb.debit, 0) AS dette_totale,
  COALESCE(sb.credit, 0) AS avoir_total,
  GREATEST(0, COALESCE(sb.debit, 0) - COALESCE(sb.credit, 0)) AS solde_du,
  COUNT(DISTINCT p.id_purchase) AS nb_achats,
  COALESCE(SUM(p.total_amount), 0) AS total_achats
FROM supplier s
LEFT JOIN supplier_balance sb ON sb.id_supplier = s.id_supplier
LEFT JOIN purchases p ON p.id_supplier = s.id_supplier AND p.lifecycle_status != -3
GROUP BY s.id_supplier, s.ref, s.name, sb.debit, sb.credit;

-- 3.b. Vue du catalogue et conditions fournisseurs
CREATE OR REPLACE VIEW v_supplier_catalog AS
SELECT 
  sp.id_supplier_product,
  s.id_supplier,
  s.name AS fournisseur,
  sp.ref AS ref_produit,
  sp.name AS produit_fournisseur,
  sp.actual_price AS prix_actuel,
  sp.min_purchase_number AS min_commande
FROM supplier_products sp
JOIN supplier s ON s.id_supplier = sp.id_supplier;

-- 4. Vue des alertes de stock
CREATE OR REPLACE VIEW v_stock_alerts AS
SELECT 
  i.id_item,
  i.ref AS ref_article,
  i.label AS article,
  i.quantity AS stock_actuel,
  i.minimum_stock_level AS seuil_minimum,
  i.is_perishable AS est_perissable,
  CASE 
    WHEN i.quantity <= i.minimum_stock_level THEN 'RUPTURE_OU_CRITIQUE'
    WHEN i.quantity <= i.minimum_stock_level * 1.5 THEN 'ATTENTION'
    ELSE 'OK'
  END AS alerte_stock,
  uom.symbol AS unite
FROM items i
LEFT JOIN unit_of_measure uom ON uom.id_unit = i.id_unit
WHERE i.status = 0;

-- 5. Vue des employés actifs avec leur poste
CREATE OR REPLACE VIEW v_employees_active AS
WITH latest_job AS (
  SELECT DISTINCT ON (id_employee)
    id_employee,
    id_job_title,
    assignment_date,
    confirmed_date,
    status
  FROM employees_job
  WHERE status IN (0, 5) AND (end_date IS NULL OR end_date > CURRENT_DATE)
  ORDER BY id_employee, assignment_date DESC
)
SELECT 
  e.id_employee,
  e.employee_code,
  CONCAT(e.name, ' ', e.lastname) AS nom_complet,
  e.name,
  e.lastname,
  COALESCE(jt.title, 'Sans poste') AS poste,
  lj.assignment_date,
  lj.confirmed_date,
  COALESCE(lj.status, 5) AS status_poste,
  e.active_status
FROM employees e
LEFT JOIN latest_job lj ON lj.id_employee = e.id_employee
LEFT JOIN job_titles jt ON jt.id_job_title = lj.id_job_title
WHERE (e.active_status IS NULL OR e.active_status >= 0)
  AND e.employee_code NOT ILIKE 'EMP-TEST%';
