// ─── DB Schema summary exposed to the LLM ────────────────────────────────────
// Only includes tables relevant to analytics. Column names match the actual DB.

export const SCHEMA_SUMMARY = `
Tables et Vues disponibles (PostgreSQL) — lecture seule :
Fonctions utiles : similarity(text1, text2) disponible via extension pg_trgm (score entre 0 et 1). Pour recherche insensible aux espaces : REPLACE(LOWER(colonne), ' ', '') LIKE '%' || REPLACE(LOWER($1), ' ', '') || '%'.

VUES METIER SIMPLIFIEES (A UTILISER EN PRIORITE ABSOLUE) :
[sale.manage]
  v_sellers(id_employee, employee_code, nom_complet, poste, is_dedicated_seller, assignment_date, confirmed_date, nb_ventes, ca_total, panier_moyen, derniere_vente)
    -- Donne la performance commerciale. Pour vendeurs/caissiers sans vente: WHERE is_dedicated_seller = true AND nb_ventes = 0. Pour vendeurs ayant vendu: WHERE nb_ventes > 0.
  v_menu_sales(id_menu, code_menu, id_item, article, categorie, prix_vente, cout_matiere, marge_unitaire, taux_marge_pct, quantite_vendue, ca_total, benefice_brut_total, nb_commandes, derniere_vente)
    -- Contient tous les plats et boissons avec code (ex: MNU0001), prix de vente, cout_matiere, marge_unitaire, taux_marge_pct, benefice_brut_total, volume et CA. A utiliser pour TOP/FLOP ventes, marges et rentabilite/benefice !

[stock.read | stock.manage | stock.access]
  v_recipes(id_recipe, id_item, article, version, is_active, recipe_cost, yield_quantity, cout_portion, created_at)
    -- Contient les fiches techniques et differentes versions de recettes pour chaque plat (version 1, 2, 3...). cout_portion = cout de revient par portion. A utiliser pour connaitre la composition/cout d'un plat et comparer les versions !
  v_recipe_ingredients(plat, version, is_active, ingredient, quantity, unite)
    -- Contient la composition exacte des recettes : chaque ingredient, sa quantite et son unite par plat et version !

[restaurant.purchases]
  v_supplier_debts(id_supplier, ref_fournisseur, fournisseur, dette_totale, avoir_total, solde_du, nb_achats, total_achats)
    -- Contient les dettes fournisseurs reelles, avoirs et totaux d'achats par fournisseur (Super U, etc.).

[stock.manage | supplier.manage | restaurant.purchases]
  v_supplier_catalog(fournisseur, ref_produit, produit_fournisseur, prix_actuel, min_commande)
    -- Contient les articles du catalogue des fournisseurs avec le prix actuel et le minimum de commande.

[stock.read | stock.manage]
  v_stock_alerts(id_item, ref_article, article, stock_actuel, seuil_minimum, est_perissable, alerte_stock ['RUPTURE_OU_CRITIQUE' | 'ATTENTION' | 'OK'], unite)
    -- Contient l'etat des stocks et detecte directement les ruptures et alertes.

[employee.manage | security.access]
  v_employees_active(id_employee, employee_code, nom_complet, name, lastname, poste, assignment_date, confirmed_date, status_poste [0=confirme, 5=en_attente], active_status)
    -- Contient tous les employes actifs avec leur poste officiel actuel, nom complet et dates.

TABLES DE BASE (a utiliser si la vue ne suffit pas ou pour des requetes croisees avancees) :

[employee.manage | security.access]
  employees(id_employee, employee_code, name, lastname, birthdate, address, active_status [integer: actif si 0 ou NULL ou 1; inactif si -1 ou -3])
  employees_job(id_emp_job, id_employee, id_job_title, id_employment_type, assignment_date, end_date, base_salary, status [integer: 0=confirme, 5=en_attente, -3=annule], confirmed_date) -- base_salary = salaire de base. Joindre job_titles jt ON jt.id_job_title = employees_job.id_job_title (jt.title = nom du poste)
  job_titles(id_job_title, title)
  team(id_team, team_name)
  employee_team(id_employee_team, id_team, id_employee) -- joindre team t et employees e
  users(id_user, ref, username, active_status [integer: 1=actif/activé, 0=en attente d'activation, -1=désactivé], created_date, id_employee) -- joindre employees e pour nom complet
  internship(id_internship, id_employee, id_school, academic_supervisor_name, professionnal_supervisor_name) -- stagiaires de l'etablissement. Joindre employees e et schools s ON s.id_school = internship.id_school (s.name = nom ecole)
  schools(id_school, name)

[hr.access]
  leaves(id_leave, ref, id_employee, id_leave_type, start_date, end_date, status [integer: 5=en attente, 0=validé, -1=rejeté, -3=annulé]) -- joindre employees e et leave_types lt (lt.label)
  leave_types(id_leave_type, label, is_paid, deduction_mode)
  employee_leave_balances(id_employee_leave_balance, id_employee, id_leave_type, allocated_days, used_days)
  attendances(id_attendance, id_employee, id_schedule, clock_in, clock_out) -- joindre employees e
  schedules(id_schedule, id_employee, id_shift_type, schedule_date) -- joindre employees e et shift_type st (st.label)
  shift_type(id_shift_type, label, start_time, end_time)

[sales.pos | sale.manage]
  sales(id_sale, ref, sale_date, total_amount, table_number, charge_to_room, id_room, id_invoice, status [integer: 5=ouverte, 0=fermée, -3=annulée; ventes valides: status != -3], id_saler) -- table_number = numero de table au restaurant; charge_to_room (boolean) = facture sur la chambre; joindre room r ON r.id_room = sales.id_room (r.room_number) et employees e ON e.id_employee = sales.id_saler
  sale_items(id_sale_item, id_sale, id_menu, quantity, unit_price, total_amount) -- joindre menu_items mi ON mi.id_menu = sale_items.id_menu JOIN items i ON i.id_item = mi.id_item (i.label = nom du plat)
  invoice(id_invoice, ref, total_amount, balance_due, status [integer: 5=impayée, 3=partiellement payée, 0=totalement payée], created_at)
  menu_items(id_menu, ref, id_item, sale_price, unit_cost, id_category) -- unit_cost = cout matiere/revient. Joindre items i ON i.id_item = menu_items.id_item (i.label) et menu_categories mc ON mc.id_category = menu_items.id_category (mc.label)
  menu_categories(id_category, label)
  payment(id_payment, id_invoice, id_payment_method, amount, payment_date) -- joindre payment_method pm (pm.label = mode de paiement, ex: Espèces, Carte)
  payment_method(id_payment_method, label)
  cash_journal(id_journal, ref, journal_opening, journal_closing, expected_closing_balance, actual_closing_balance, cash_discrepancy, id_cashier) -- joindre employees e ON e.id_employee = cash_journal.id_cashier
  cash_movement(id_cash_movement, ref, amount, movement_date, reason, direction [integer: 5=entrée, -5=sortie], status [integer: 5=enregistré])
  room(id_room, room_number, id_room_type, description) -- chambres de l'hotel. Joindre room_type rt ON rt.id_room_type = room.id_room_type (rt.label = categorie chambre)
  room_type(id_room_type, label, description)

[restaurant.purchases]
  purchases(id_purchase, ref, purchase_date, total_amount, id_supplier, id_purchaser, lifecycle_status [integer: 0=confirmé, 5=en attente, -3=annulé], status [integer: 6=créé, 3=partiellement livré, 0=livré]) -- joindre supplier s (s.name) et employees e (nom acheteur)
  purchase_details(id_purchase_detail, id_purchase, id_supplied_item, quantity, unit_price, total_amount) -- joindre supplied_items si ON si.id_supplied_item = purchase_details.id_supplied_item JOIN items i ON i.id_item = si.id_item (i.label = nom de l'article acheté)
  supplied_items(id_supplied_item, id_item, id_supplier_product) -- joindre items i et supplier_products sp
  supplier(id_supplier, ref, name)
  supplier_products(id_supplier_product, ref, name, actual_price, min_purchase_number, id_supplier) -- articles catalogues des fournisseurs avec prix actuel et min de commande
  supplier_products_price(id_supplier_product_price, id_supplier_product, price, change_date) -- historique des variations de prix des fournisseurs au fil du temps
  supplier_balance(id_supplier_balance, id_supplier, credit, debit) -- debit = dette brute, credit = avoir; solde dû = GREATEST(0, debit - credit)
  supplier_payment(id_supplier_payment, ref, id_supplier, payment_date, amount) -- decaissements effectifs
  product_delivery(id_delivery, ref, delivery_date, total_amount, balance_due, status [integer: 0=validé, 5=ouvert]) -- livraisons physiques fournisseurs. balance_due = reliquat a payer
  delivery_details(id_detail, id_delivery, id_supplied_item, quantity, unit_price, total_amount) -- articles et quantites reellement receptionnees

[stock.read | stock.manage]
  items(id_item, ref, label, quantity, minimum_stock_level, is_perishable, status [integer: 0=actif, -1=inactif]) -- i.label = nom/désignation en clair
  stock_movement(id_stock_movement, ref, id_item, movement_date, quantity, movement_type [integer: 1=réception, 2=manuel, 3=perte, 4=inventaire], direction [integer: 5=entrée, -5=sortie], status [integer: 0=validé, 5=brouillon]) -- joindre items i
  item_type(id_product_type, label)
  unit_of_measure(id_unit, label, symbol)
  recipes(id_recipe, id_item, version, is_active, recipe_cost, yield_quantity) -- fiches techniques recettes
  recipe_details(id_recipe_detail, id_recipe, id_ingredient, quantity, id_item_unit) -- ingredients de recette. Joindre items i ON i.id_item = recipe_details.id_ingredient (i.label)
  dish_production(id_dish_production, ref, id_item, production_date, quantity, status [integer: 0=validé, 5=brouillon], id_operator) -- fabrications de plats en cuisine. Joindre items i (nom plat) et employees e ON e.id_employee = dish_production.id_operator (nom cuisinier)
`;
