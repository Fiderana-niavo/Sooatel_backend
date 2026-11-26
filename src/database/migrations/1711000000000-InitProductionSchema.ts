import { MigrationInterface, QueryRunner } from "typeorm";

export class InitProductionSchema1711000000000 implements MigrationInterface {
  name = "InitProductionSchema1711000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const sql = `-- =========================================================================
-- SOOATEL ERP - PRODUCTION DATABASE INITIALIZATION & MIGRATION SCHEMA
-- Version : 1.0.0 (Production Ready)
-- Database : PostgreSQL 15+ (with uuid-ossp, vector, pg_trgm extensions)
-- =========================================================================

-- Remarque pour les hébergeurs infogérés (AWS RDS, Supabase, Neon, Docker, etc.) :
-- La base de données et l'utilisateur de connexion sont créés en amont par votre orchestrateur.
-- Si vous créez la base localement manuellement, décommentez les 2 lignes suivantes :
-- CREATE DATABASE sooatel;
-- \\c sooatel;

-- =========================================================================
-- 1. EXTENSIONS POSTGRESQL
-- =========================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =========================================================================
-- 2. SÉQUENCES MÉTIER POUR LES RÉFÉRENCES AUTOMATIQUES
-- =========================================================================
CREATE SEQUENCE IF NOT EXISTS supplier_ref_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS employee_ref_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS user_ref_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS supplier_product_ref_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS item_ref_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS purchase_ref_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS delivery_ref_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS supplier_payment_ref_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS stock_mvmt_ref_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS journal_ref_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS cash_movement_ref_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS leave_ref_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS dish_production_ref_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS menu_item_ref_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS invoice_ref_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS sale_ref_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS payment_ref_seq START WITH 1;

-- =========================================================================
-- 3. CONFIGURATIONS ET PARAMÈTRES
-- =========================================================================

CREATE TABLE IF NOT EXISTS Job_titles(
   id_job_title UUID DEFAULT uuid_generate_v4(),
   title VARCHAR(100) NOT NULL,
   PRIMARY KEY(id_job_title)
);

CREATE TABLE IF NOT EXISTS role(
   id_role UUID DEFAULT uuid_generate_v4(),
   label VARCHAR(50) NOT NULL,
   description VARCHAR(255),
   PRIMARY KEY(id_role),
   UNIQUE(label)
);

CREATE TABLE IF NOT EXISTS permission_category(
   id_category UUID DEFAULT uuid_generate_v4(),
   name VARCHAR(100) NOT NULL UNIQUE,
   code VARCHAR(50) NOT NULL UNIQUE,
   PRIMARY KEY(id_category)
);

CREATE TABLE IF NOT EXISTS Permission(
   id_permission UUID DEFAULT uuid_generate_v4(),
   name VARCHAR(100) NOT NULL,
   code VARCHAR(50) NOT NULL,
   description VARCHAR(255),
   id_category UUID NOT NULL,
   PRIMARY KEY(id_permission),
   UNIQUE(code),
   FOREIGN KEY(id_category) REFERENCES permission_category(id_category) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Item_type(
   id_product_type UUID DEFAULT uuid_generate_v4(),
   label VARCHAR(100) NOT NULL,
   description VARCHAR(255),
   PRIMARY KEY(id_product_type)
);

CREATE TABLE IF NOT EXISTS Unit_of_measure(
   id_unit UUID DEFAULT uuid_generate_v4(),
   label VARCHAR(50) NOT NULL,
   symbol VARCHAR(10) NOT NULL,
   PRIMARY KEY(id_unit)
);

CREATE TABLE IF NOT EXISTS Payment_method(
   id_payment_method UUID DEFAULT uuid_generate_v4(),
   label VARCHAR(50) NOT NULL,
   description VARCHAR(100),
   PRIMARY KEY(id_payment_method)
);

CREATE TABLE IF NOT EXISTS Room_type(
   id_room_type UUID DEFAULT uuid_generate_v4(),
   label VARCHAR(50) NOT NULL,
   description VARCHAR(255),
   PRIMARY KEY(id_room_type),
   UNIQUE(label)
);

CREATE TABLE IF NOT EXISTS leave_types(
   id_leave_type UUID DEFAULT uuid_generate_v4(),
   label VARCHAR(50) NOT NULL,
   is_paid BOOLEAN DEFAULT TRUE,
   requires_proof BOOLEAN DEFAULT FALSE,
   deduction_mode VARCHAR(20) DEFAULT 'NEVER',
   cap INTEGER,
   cap_period VARCHAR(20),
   PRIMARY KEY(id_leave_type),
   UNIQUE(label)
);

CREATE TABLE IF NOT EXISTS Shift_type(
   id_shift_type UUID DEFAULT uuid_generate_v4(),
   label VARCHAR(50) NOT NULL,
   custom_start_time TIME NOT NULL,
   custom_end_time TIME NOT NULL,
   start_time TIME,
   end_time TIME,
   description VARCHAR(255),
   PRIMARY KEY(id_shift_type)
);

CREATE TABLE IF NOT EXISTS Team(
   id_team UUID DEFAULT uuid_generate_v4(),
   team_name VARCHAR(70) NOT NULL,
   description VARCHAR(100),
   UNIQUE(team_name),
   PRIMARY KEY(id_team)
);

CREATE TABLE IF NOT EXISTS Menu_categories(
   id_category UUID DEFAULT uuid_generate_v4(),
   label VARCHAR(100) NOT NULL,
   description VARCHAR(255),
   PRIMARY KEY(id_category),
   UNIQUE(label)
);

CREATE TABLE IF NOT EXISTS schools(
   id_school UUID DEFAULT uuid_generate_v4(),
   name VARCHAR(150) NOT NULL UNIQUE,
   address VARCHAR(255),
   email VARCHAR(100),
   phone VARCHAR(25),
   PRIMARY KEY(id_school)
);

-- =========================================================================
-- 4. ACTEURS (Fournisseurs, Employés, Utilisateurs, Stagiaires)
-- =========================================================================

CREATE TABLE IF NOT EXISTS Supplier(
   id_supplier UUID DEFAULT uuid_generate_v4(),
   ref VARCHAR(20) NOT NULL DEFAULT 'SUP' || to_char(nextval('supplier_ref_seq'), 'fm0000'),
   name VARCHAR(100) NOT NULL,
   address VARCHAR(100),
   description VARCHAR(255),
   provides_delivery BOOLEAN DEFAULT FALSE,
   delivery_delay NUMERIC(5,2),
   notes VARCHAR(255),
   phone_number VARCHAR(20),
   email VARCHAR(100),
   PRIMARY KEY(id_supplier),
   UNIQUE(ref)
);

CREATE TABLE IF NOT EXISTS Employees(
   id_employee UUID DEFAULT uuid_generate_v4(),
   employee_code VARCHAR(20) NOT NULL DEFAULT 'EMP' || to_char(nextval('employee_ref_seq'), 'fm0000'),
   name VARCHAR(100),
   lastname VARCHAR(100),
   birthdate DATE,
   address VARCHAR(255),
   email_contact VARCHAR(254),
   phone_number VARCHAR(20),
   notes VARCHAR(255),
   active_status INTEGER DEFAULT 0,
   base_salary NUMERIC(15,2),
   PRIMARY KEY(id_employee),
   UNIQUE(employee_code),
   UNIQUE(email_contact),
   UNIQUE(phone_number),
   CONSTRAINT chk_name_or_lastname CHECK (name IS NOT NULL OR lastname IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS Internship(
   id_internship UUID DEFAULT uuid_generate_v4(),
   school_name VARCHAR(100),
   id_school UUID,
   academic_supervisor_name VARCHAR(255),
   academic_supervisor_email VARCHAR(100),
   academic_supervisor_number VARCHAR(25),
   professionnal_supervisor_name VARCHAR(255),
   id_employee UUID NOT NULL,
   PRIMARY KEY(id_internship),
   FOREIGN KEY(id_school) REFERENCES schools(id_school) ON DELETE SET NULL,
   FOREIGN KEY(id_employee) REFERENCES Employees(id_employee) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Users(
   id_user UUID DEFAULT uuid_generate_v4(),
   ref VARCHAR(20) NOT NULL DEFAULT 'USR' || to_char(nextval('user_ref_seq'), 'fm0000'),
   username VARCHAR(254) NOT NULL,
   password_hash VARCHAR(255) NOT NULL,
   active_status INTEGER NOT NULL DEFAULT 0,
   activated_at TIMESTAMPTZ,
   activated_from TIMESTAMPTZ,
   created_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   id_employee UUID NOT NULL,
   PRIMARY KEY(id_user),
   UNIQUE(username),
   UNIQUE(ref),
   FOREIGN KEY(id_employee) REFERENCES Employees(id_employee) ON DELETE CASCADE
);

-- =========================================================================
-- 5. PRODUITS, ARTICLES ET STOCKS
-- =========================================================================

CREATE TABLE IF NOT EXISTS Supplier_products(
   id_supplier_product UUID DEFAULT uuid_generate_v4(),
   ref VARCHAR(20) NOT NULL DEFAULT 'SPR' || to_char(nextval('supplier_product_ref_seq'), 'fm0000'),
   name VARCHAR(50) NOT NULL,
   actual_price NUMERIC(15,2) NOT NULL,
   min_purchase_number NUMERIC(10,2) NOT NULL DEFAULT 0,
   id_supplier UUID NOT NULL,
   notes VARCHAR(255),
   PRIMARY KEY(id_supplier_product),
   UNIQUE(ref),
   FOREIGN KEY(id_supplier) REFERENCES Supplier(id_supplier) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Supplier_products_price(
   id_supplier_product_price UUID DEFAULT uuid_generate_v4(),
   price NUMERIC(15,2) NOT NULL,
   change_date DATE NOT NULL,
   id_supplier_product UUID NOT NULL,
   PRIMARY KEY(id_supplier_product_price),
   FOREIGN KEY(id_supplier_product) REFERENCES Supplier_products(id_supplier_product) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Items(
   id_item UUID DEFAULT uuid_generate_v4(),
   ref VARCHAR(20) NOT NULL DEFAULT 'ART' || to_char(nextval('item_ref_seq'), 'fm0000'),
   label VARCHAR(100) NOT NULL,
   is_produced BOOLEAN DEFAULT FALSE,
   quantity NUMERIC(15,2) DEFAULT 0,
   minimum_stock_level NUMERIC(15,2) NOT NULL DEFAULT 0,
   reorder_quantity NUMERIC(15,2),
   is_perishable BOOLEAN NOT NULL DEFAULT FALSE,
   status INTEGER NOT NULL DEFAULT 0,
   id_product_type UUID NOT NULL,
   id_unit UUID NOT NULL,
   description VARCHAR(255),
   weighted_average_cost NUMERIC(15,6) DEFAULT 0,
   PRIMARY KEY(id_item),
   UNIQUE(label),
   UNIQUE(ref),
   FOREIGN KEY(id_product_type) REFERENCES Item_type(id_product_type),
   FOREIGN KEY(id_unit) REFERENCES Unit_of_measure(id_unit)
);

CREATE TABLE IF NOT EXISTS Supplied_Items(
   id_supplied_item UUID DEFAULT uuid_generate_v4(),
   id_item UUID NOT NULL,
   id_supplier_product UUID NOT NULL,
   PRIMARY KEY(id_supplied_item),
   FOREIGN KEY(id_item) REFERENCES Items(id_item) ON DELETE CASCADE,
   FOREIGN KEY(id_supplier_product) REFERENCES Supplier_products(id_supplier_product) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Item_unit(
   id_item_unit UUID DEFAULT uuid_generate_v4(),
   to_stock_ratio NUMERIC(15,6) NOT NULL,
   alternative_unit UUID NOT NULL,
   id_item UUID NOT NULL,
   PRIMARY KEY(id_item_unit),
   FOREIGN KEY(alternative_unit) REFERENCES Unit_of_measure(id_unit),
   FOREIGN KEY(id_item) REFERENCES Items(id_item) ON DELETE CASCADE
);

-- =========================================================================
-- 6. LOGISTIQUE, ACHATS ET LIVRAISONS FOURNISSEURS
-- =========================================================================

CREATE TABLE IF NOT EXISTS Purchases(
   id_purchase UUID DEFAULT uuid_generate_v4(),
   ref VARCHAR(20) NOT NULL DEFAULT 'ACH' || to_char(nextval('purchase_ref_seq'), 'fm0000'),
   purchase_date DATE NOT NULL,
   total_amount NUMERIC(15,2) CHECK (total_amount >= 0),
   balance_due NUMERIC(15,2) DEFAULT 0,
   status INTEGER DEFAULT 0,
   lifecycle_status INTEGER DEFAULT 5,
   id_supplier UUID NOT NULL,
   id_purchaser UUID NOT NULL,
   PRIMARY KEY(id_purchase),
   UNIQUE(ref),
   FOREIGN KEY(id_supplier) REFERENCES Supplier(id_supplier),
   FOREIGN KEY(id_purchaser) REFERENCES Employees(id_employee)
);

CREATE TABLE IF NOT EXISTS Purchase_details(
   id_purchase_detail UUID DEFAULT uuid_generate_v4(),
   id_purchase UUID NOT NULL,
   id_supplied_item UUID NOT NULL,
   quantity NUMERIC(10,2) NOT NULL,
   unit_price NUMERIC(15,2),
   total_amount NUMERIC(15,2) CHECK (total_amount >= 0),
   PRIMARY KEY(id_purchase_detail),
   FOREIGN KEY(id_supplied_item) REFERENCES Supplied_Items(id_supplied_item),
   FOREIGN KEY(id_purchase) REFERENCES Purchases(id_purchase) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Product_delivery(
   id_delivery UUID DEFAULT uuid_generate_v4(),
   ref VARCHAR(20) NOT NULL DEFAULT 'LIV' || to_char(nextval('delivery_ref_seq'), 'fm0000'),
   delivery_date TIMESTAMPTZ NOT NULL,
   total_amount NUMERIC(15,2),
   balance_due NUMERIC(15,2) DEFAULT 0,
   status INTEGER,
   notes TEXT,
   PRIMARY KEY(id_delivery),
   UNIQUE(ref)
);

CREATE TABLE IF NOT EXISTS Delivery_details(
   id_detail UUID DEFAULT uuid_generate_v4(),
   quantity NUMERIC(10,2) NOT NULL,
   unit_price NUMERIC(15,2) NOT NULL,
   total_amount NUMERIC(15,2),
   id_supplied_item UUID NOT NULL,
   id_delivery UUID NOT NULL,
   PRIMARY KEY(id_detail),
   FOREIGN KEY(id_supplied_item) REFERENCES Supplied_Items(id_supplied_item),
   FOREIGN KEY(id_delivery) REFERENCES Product_delivery(id_delivery) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Purchase_delivery(
   id_purchase_delivery UUID DEFAULT uuid_generate_v4(),
   id_purchase UUID NOT NULL,
   id_delivery UUID NOT NULL,
   PRIMARY KEY(id_purchase_delivery),
   UNIQUE(id_purchase, id_delivery),
   FOREIGN KEY(id_purchase) REFERENCES Purchases(id_purchase) ON DELETE CASCADE,
   FOREIGN KEY(id_delivery) REFERENCES Product_delivery(id_delivery) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Supplier_payment(
   id_supplier_payment UUID DEFAULT uuid_generate_v4(),
   ref VARCHAR(20) NOT NULL DEFAULT 'PAY-' || to_char(nextval('supplier_payment_ref_seq'), 'fm0000'),
   id_supplier UUID NOT NULL,
   payment_date DATE NOT NULL,
   amount NUMERIC(15,2),
   id_processed_by UUID NOT NULL,
   notes TEXT,
   PRIMARY KEY(id_supplier_payment),
   UNIQUE(ref),
   FOREIGN KEY(id_supplier) REFERENCES Supplier(id_supplier),
   FOREIGN KEY(id_processed_by) REFERENCES Employees(id_employee)
);

CREATE TABLE IF NOT EXISTS Supplier_payment_allocation(
   id_allocation UUID DEFAULT uuid_generate_v4(),
   id_supplier_payment UUID NOT NULL,
   allocation_type VARCHAR(20) NOT NULL,
   id_delivery UUID,
   id_purchase UUID,
   amount NUMERIC(15,2) NOT NULL,
   PRIMARY KEY(id_allocation),
   FOREIGN KEY(id_supplier_payment) REFERENCES Supplier_payment(id_supplier_payment) ON DELETE CASCADE,
   FOREIGN KEY(id_delivery) REFERENCES Product_delivery(id_delivery),
   FOREIGN KEY(id_purchase) REFERENCES Purchases(id_purchase),
   CHECK (allocation_type IN ('DELIVERY', 'DEPOSIT', 'SUPPLIER_CREDIT')),
   CONSTRAINT chk_allocation_consistency CHECK (
      (allocation_type = 'DELIVERY'        AND id_delivery IS NOT NULL AND id_purchase IS NULL) OR
      (allocation_type = 'DEPOSIT'         AND id_purchase IS NOT NULL AND id_delivery IS NULL) OR
      (allocation_type = 'SUPPLIER_CREDIT' AND id_delivery IS NULL     AND id_purchase IS NULL)
   )
);

CREATE TABLE IF NOT EXISTS Supplier_payment_line(
   id_payment_line UUID DEFAULT uuid_generate_v4(),
   id_supplier_payment UUID NOT NULL,
   id_payment_method UUID NOT NULL,
   amount NUMERIC(15,2) NOT NULL,
   PRIMARY KEY(id_payment_line),
   FOREIGN KEY(id_supplier_payment) REFERENCES Supplier_payment(id_supplier_payment) ON DELETE CASCADE,
   FOREIGN KEY(id_payment_method) REFERENCES Payment_method(id_payment_method)
);

CREATE TABLE IF NOT EXISTS supplier_balance(
   id_supplier_balance UUID DEFAULT uuid_generate_v4(),
   id_supplier UUID NOT NULL UNIQUE,
   credit NUMERIC(15,2) NOT NULL DEFAULT 0,
   debit NUMERIC(15,2) NOT NULL DEFAULT 0,
   PRIMARY KEY(id_supplier_balance),
   FOREIGN KEY(id_supplier) REFERENCES Supplier(id_supplier) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Stock_movement(
   id_stock_movement UUID DEFAULT uuid_generate_v4(),
   ref VARCHAR(20) NOT NULL DEFAULT 'MVT' || to_char(nextval('stock_mvmt_ref_seq'), 'fm0000'),
   id_item UUID NOT NULL,
   movement_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   quantity NUMERIC(15,2) NOT NULL,
   movement_type INTEGER,
   direction INTEGER,
   reason VARCHAR(500),
   status INTEGER NOT NULL DEFAULT 0,
   id_operator UUID NOT NULL,
   PRIMARY KEY(id_stock_movement),
   UNIQUE(ref),
   FOREIGN KEY(id_item) REFERENCES Items(id_item),
   FOREIGN KEY(id_operator) REFERENCES Employees(id_employee)
);

-- =========================================================================
-- 7. CAISSE ET TRÉSORERIE
-- =========================================================================

CREATE TABLE IF NOT EXISTS Cash_journal(
   id_journal UUID DEFAULT uuid_generate_v4(),
   ref VARCHAR(20) NOT NULL DEFAULT 'JRN' || to_char(nextval('journal_ref_seq'), 'fm0000'),
   journal_opening TIMESTAMPTZ NOT NULL,
   journal_closing TIMESTAMPTZ,
   expected_closing_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
   actual_closing_balance NUMERIC(15,2),
   cash_discrepancy NUMERIC(15,2),
   id_cashier UUID NOT NULL,
   PRIMARY KEY(id_journal),
   UNIQUE(ref),
   FOREIGN KEY(id_cashier) REFERENCES Employees(id_employee)
);

CREATE TABLE IF NOT EXISTS Cash_movement_category(
   id_cash_movement_category UUID DEFAULT uuid_generate_v4(),
   label VARCHAR(80) NOT NULL,
   allowed_direction INTEGER NOT NULL,
   PRIMARY KEY(id_cash_movement_category),
   UNIQUE(label)
);

CREATE TABLE IF NOT EXISTS Cash_movement(
   id_cash_movement UUID DEFAULT uuid_generate_v4(),
   ref VARCHAR(20) NOT NULL DEFAULT 'MVT' || to_char(nextval('cash_movement_ref_seq'), 'fm0000'),
   amount NUMERIC(15,2) NOT NULL CHECK (amount >= 0),
   movement_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   reason VARCHAR(255),
   invoice_reference VARCHAR(100),
   direction INTEGER NOT NULL,
   id_processed_by UUID NOT NULL,
   id_journal UUID NOT NULL,
   status INTEGER,
   id_cash_movement_category UUID,
   id_payment_method UUID NOT NULL,
   PRIMARY KEY(id_cash_movement),
   UNIQUE(ref),
   FOREIGN KEY(id_processed_by) REFERENCES Employees(id_employee),
   FOREIGN KEY(id_journal) REFERENCES Cash_journal(id_journal),
   FOREIGN KEY(id_cash_movement_category) REFERENCES Cash_movement_category(id_cash_movement_category),
   FOREIGN KEY(id_payment_method) REFERENCES Payment_method(id_payment_method)
);

CREATE TABLE IF NOT EXISTS payment_method_balance(
   id_payment_method_balance UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   id_journal UUID NOT NULL,
   id_payment_method UUID NOT NULL,
   amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
   CONSTRAINT fk_payment_method_balance_journal FOREIGN KEY (id_journal) REFERENCES cash_journal(id_journal) ON DELETE CASCADE,
   CONSTRAINT fk_payment_method_balance_payment_method FOREIGN KEY (id_payment_method) REFERENCES payment_method(id_payment_method),
   CONSTRAINT UQ_journal_payment UNIQUE (id_journal, id_payment_method)
);

-- =========================================================================
-- 8. RESSOURCES HUMAINES (Contrats, Plannings, Congés)
-- =========================================================================

CREATE TABLE IF NOT EXISTS Employment_type(
   id_employment_type UUID DEFAULT uuid_generate_v4(),
   label VARCHAR(50) NOT NULL,
   description VARCHAR(255),
   PRIMARY KEY(id_employment_type),
   UNIQUE(label)
);

CREATE TABLE IF NOT EXISTS Employee_team(
   id_employee_team UUID DEFAULT uuid_generate_v4(),
   id_team UUID NOT NULL,
   id_employee UUID NOT NULL,
   PRIMARY KEY(id_employee_team),
   UNIQUE(id_team, id_employee),
   FOREIGN KEY(id_team) REFERENCES Team(id_team) ON DELETE CASCADE,
   FOREIGN KEY(id_employee) REFERENCES Employees(id_employee) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Schedules(
   id_schedule UUID DEFAULT uuid_generate_v4(),
   schedule_date DATE NOT NULL,
   id_shift_type UUID NOT NULL,
   id_employee UUID NOT NULL,
   PRIMARY KEY(id_schedule),
   FOREIGN KEY(id_shift_type) REFERENCES Shift_type(id_shift_type),
   FOREIGN KEY(id_employee) REFERENCES Employees(id_employee) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Employee_requirements(
   id_requirement UUID DEFAULT uuid_generate_v4(),
   day_of_week INTEGER NOT NULL,
   required_count INTEGER NOT NULL DEFAULT 1,
   id_shift_type UUID NOT NULL,
   id_job_title UUID NOT NULL,
   PRIMARY KEY(id_requirement),
   FOREIGN KEY(id_shift_type) REFERENCES Shift_type(id_shift_type),
   FOREIGN KEY(id_job_title) REFERENCES Job_titles(id_job_title)
);

CREATE TABLE IF NOT EXISTS Leaves(
   id_leave UUID DEFAULT uuid_generate_v4(),
   ref VARCHAR(20) NOT NULL DEFAULT 'CONG' || to_char(nextval('leave_ref_seq'), 'fm0000'),
   start_date TIMESTAMPTZ NOT NULL,
   end_date TIMESTAMPTZ NOT NULL,
   leave_unit VARCHAR(10),
   id_employee UUID NOT NULL,
   id_leave_type UUID NOT NULL,
   status INTEGER DEFAULT 5,
   PRIMARY KEY(id_leave),
   UNIQUE(ref),
   FOREIGN KEY(id_employee) REFERENCES Employees(id_employee) ON DELETE CASCADE,
   FOREIGN KEY(id_leave_type) REFERENCES leave_types(id_leave_type)
);

CREATE TABLE IF NOT EXISTS Leave_transactions(
   id_transaction UUID DEFAULT uuid_generate_v4(),
   transaction_type VARCHAR(20) NOT NULL,
   amount NUMERIC(5,2),
   created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
   id_leave UUID,
   id_leave_type UUID NOT NULL,
   id_employee UUID NOT NULL,
   PRIMARY KEY(id_transaction),
   FOREIGN KEY(id_leave) REFERENCES Leaves(id_leave) ON DELETE SET NULL,
   FOREIGN KEY(id_leave_type) REFERENCES leave_types(id_leave_type),
   FOREIGN KEY(id_employee) REFERENCES Employees(id_employee) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Employee_leave_balances(
   id_employee_leave_balance UUID DEFAULT uuid_generate_v4(),
   allocated_days NUMERIC(6,2) NOT NULL DEFAULT 0,
   used_days NUMERIC(6,2) DEFAULT 0,
   advance_days NUMERIC(6,2) DEFAULT 0,
   id_employee UUID NOT NULL,
   id_leave_type UUID NOT NULL,
   PRIMARY KEY(id_employee_leave_balance),
   UNIQUE(id_employee, id_leave_type),
   FOREIGN KEY(id_employee) REFERENCES Employees(id_employee) ON DELETE CASCADE,
   FOREIGN KEY(id_leave_type) REFERENCES leave_types(id_leave_type)
);

CREATE TABLE IF NOT EXISTS Employees_job(
   id_emp_job UUID DEFAULT uuid_generate_v4(),
   assignment_date DATE NOT NULL DEFAULT CURRENT_DATE,
   end_date DATE,
   has_fixed_schedule BOOLEAN DEFAULT FALSE,
   status INTEGER DEFAULT 5,
   confirmed_date TIMESTAMPTZ,
   base_salary NUMERIC(15,2),
   id_employment_type UUID NOT NULL,
   id_employee UUID NOT NULL,
   id_job_title UUID NOT NULL,
   PRIMARY KEY(id_emp_job),
   FOREIGN KEY(id_employment_type) REFERENCES Employment_type(id_employment_type),
   FOREIGN KEY(id_employee) REFERENCES Employees(id_employee) ON DELETE CASCADE,
   FOREIGN KEY(id_job_title) REFERENCES Job_titles(id_job_title)
);

CREATE TABLE IF NOT EXISTS Employee_availabilities(
   id_availability UUID DEFAULT uuid_generate_v4(),
   day_of_week INTEGER NOT NULL,
   id_shift_type UUID NOT NULL,
   id_emp_job UUID NOT NULL,
   PRIMARY KEY(id_availability),
   FOREIGN KEY(id_shift_type) REFERENCES Shift_type(id_shift_type),
   FOREIGN KEY(id_emp_job) REFERENCES Employees_job(id_emp_job) ON DELETE CASCADE
);

-- =========================================================================
-- 9. RESTAURATION, PRODUCTIONS, RECETTES ET MENUS
-- =========================================================================

CREATE TABLE IF NOT EXISTS Event(
   id_event UUID DEFAULT uuid_generate_v4(),
   event_name VARCHAR(50) NOT NULL,
   start_date DATE NOT NULL,
   end_date DATE,
   PRIMARY KEY(id_event)
);

CREATE TABLE IF NOT EXISTS Recipes(
   id_recipe UUID DEFAULT uuid_generate_v4(),
   recipe_cost NUMERIC(15,2),
   yield_quantity NUMERIC(15,4) NOT NULL DEFAULT 1,
   id_item UUID NOT NULL,
   version INT NOT NULL DEFAULT 1,
   is_active BOOLEAN NOT NULL DEFAULT TRUE,
   created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY(id_recipe),
   UNIQUE(id_item, version),
   FOREIGN KEY(id_item) REFERENCES Items(id_item) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Recipe_details(
   id_recipe_detail UUID DEFAULT uuid_generate_v4(),
   quantity NUMERIC(15,2) NOT NULL,
   id_item_unit UUID,
   id_ingredient UUID NOT NULL,
   id_recipe UUID NOT NULL,
   created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY(id_recipe_detail),
   FOREIGN KEY(id_item_unit) REFERENCES Item_unit(id_item_unit),
   FOREIGN KEY(id_ingredient) REFERENCES Items(id_item),
   FOREIGN KEY(id_recipe) REFERENCES Recipes(id_recipe) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Dish_production(
   id_dish_production UUID DEFAULT uuid_generate_v4(),
   ref VARCHAR(50) NOT NULL DEFAULT 'PRD' || to_char(nextval('dish_production_ref_seq'), 'fm0000'),
   id_item UUID NOT NULL,
   production_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   quantity NUMERIC(15,2) NOT NULL,
   status INTEGER NOT NULL DEFAULT 5,
   id_operator UUID,
   notes VARCHAR(500),
   PRIMARY KEY(id_dish_production),
   FOREIGN KEY(id_item) REFERENCES Items(id_item),
   FOREIGN KEY(id_operator) REFERENCES Employees(id_employee)
);

CREATE TABLE IF NOT EXISTS Room(
   id_room UUID DEFAULT uuid_generate_v4(),
   room_number VARCHAR(50) NOT NULL,
   id_room_type UUID NOT NULL,
   description VARCHAR(255),
   PRIMARY KEY(id_room),
   UNIQUE(room_number),
   FOREIGN KEY(id_room_type) REFERENCES Room_type(id_room_type)
);

CREATE TABLE IF NOT EXISTS Menu_Items(
   id_menu UUID DEFAULT uuid_generate_v4(),
   ref VARCHAR(20) NOT NULL DEFAULT 'MNU' || to_char(nextval('menu_item_ref_seq'), 'fm0000'),
   id_item UUID NOT NULL,
   sale_price NUMERIC(10,2) NOT NULL,
   unit_cost NUMERIC(15,2),
   id_category UUID NOT NULL,
   PRIMARY KEY(id_menu),
   UNIQUE(ref),
   FOREIGN KEY(id_item) REFERENCES Items(id_item),
   FOREIGN KEY(id_category) REFERENCES Menu_categories(id_category)
);

-- =========================================================================
-- 10. VENTES, FACTURATION ET ENCAISSEMENTS
-- =========================================================================

CREATE TABLE IF NOT EXISTS Invoice(
   id_invoice UUID DEFAULT uuid_generate_v4(),
   invoice_number_system VARCHAR(30) UNIQUE NOT NULL DEFAULT 'INV' || to_char(nextval('invoice_ref_seq'), 'fm0000'),
   invoice_number VARCHAR(20) UNIQUE,
   invoice_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
   total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
   balance_due NUMERIC(15,2) NOT NULL DEFAULT 0,
   status INTEGER DEFAULT 5,
   created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
   created_by UUID,
   PRIMARY KEY(id_invoice),
   FOREIGN KEY(created_by) REFERENCES Users(id_user)
);

CREATE TABLE IF NOT EXISTS Sales(
   id_sale UUID DEFAULT uuid_generate_v4(),
   ref VARCHAR(20) NOT NULL DEFAULT 'VTE' || to_char(nextval('sale_ref_seq'), 'fm0000'),
   sale_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   total_amount NUMERIC(15,2) CHECK (total_amount >= 0),
   id_invoice UUID,
   table_number INTEGER,
   charge_to_room BOOLEAN DEFAULT FALSE,
   id_room UUID,
   id_saler UUID NOT NULL,
   status INTEGER DEFAULT 5,
   comment TEXT,
   delivery_date TIMESTAMPTZ,
   created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
   created_by UUID,
   updated_at TIMESTAMPTZ,
   updated_by UUID,
   PRIMARY KEY(id_sale),
   UNIQUE(ref),
   FOREIGN KEY(id_invoice) REFERENCES Invoice(id_invoice) ON DELETE SET NULL,
   FOREIGN KEY(id_room) REFERENCES Room(id_room),
   FOREIGN KEY(id_saler) REFERENCES Employees(id_employee),
   FOREIGN KEY(created_by) REFERENCES Users(id_user),
   FOREIGN KEY(updated_by) REFERENCES Users(id_user)
);

CREATE TABLE IF NOT EXISTS Sale_items(
   id_sale_item UUID DEFAULT uuid_generate_v4(),
   id_menu UUID NOT NULL,
   id_sale UUID NOT NULL,
   quantity INTEGER CHECK (quantity >= 1),
   unit_price NUMERIC(15,2) NOT NULL CHECK (unit_price >= 0),
   unit_cost NUMERIC(15,2),
   total_amount NUMERIC(15,2) CHECK (total_amount >= 0),
   PRIMARY KEY(id_sale_item),
   FOREIGN KEY(id_menu) REFERENCES Menu_Items(id_menu),
   FOREIGN KEY(id_sale) REFERENCES Sales(id_sale) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Payment(
   id_payment UUID DEFAULT uuid_generate_v4(),
   ref VARCHAR(20) NOT NULL DEFAULT 'REG' || to_char(nextval('payment_ref_seq'), 'fm0000'),
   id_invoice UUID NOT NULL,
   payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
   payment_code VARCHAR(30),
   amount NUMERIC(15,2) NOT NULL,
   id_payment_method UUID NOT NULL,
   id_cash_movement UUID,
   PRIMARY KEY(id_payment),
   UNIQUE(ref),
   FOREIGN KEY(id_payment_method) REFERENCES Payment_method(id_payment_method),
   FOREIGN KEY(id_invoice) REFERENCES Invoice(id_invoice) ON DELETE CASCADE,
   FOREIGN KEY(id_cash_movement) REFERENCES Cash_movement(id_cash_movement) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS product_price(
   id_product_price UUID DEFAULT uuid_generate_v4(),
   id_menu UUID NOT NULL,
   special_price NUMERIC(15,2),
   id_room_type UUID,
   id_event UUID,
   PRIMARY KEY(id_product_price),
   FOREIGN KEY(id_menu) REFERENCES Menu_Items(id_menu) ON DELETE CASCADE,
   FOREIGN KEY(id_room_type) REFERENCES Room_type(id_room_type),
   FOREIGN KEY(id_event) REFERENCES Event(id_event)
);

-- =========================================================================
-- 11. SÉCURITÉ, DROITS, SESSIONS ET AUDIT
-- =========================================================================

CREATE TABLE IF NOT EXISTS User_permission(
   id_user_permission UUID DEFAULT uuid_generate_v4(),
   id_user UUID NOT NULL,
   id_permission UUID NOT NULL,
   is_allowed BOOLEAN NOT NULL,
   PRIMARY KEY(id_user_permission),
   UNIQUE(id_user, id_permission),
   FOREIGN KEY(id_user) REFERENCES Users(id_user) ON DELETE CASCADE,
   FOREIGN KEY(id_permission) REFERENCES Permission(id_permission) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS User_role(
   id_user_role UUID DEFAULT uuid_generate_v4(),
   id_user UUID NOT NULL,
   id_role UUID NOT NULL,
   PRIMARY KEY(id_user_role),
   UNIQUE(id_user, id_role),
   FOREIGN KEY(id_user) REFERENCES Users(id_user) ON DELETE CASCADE,
   FOREIGN KEY(id_role) REFERENCES role(id_role) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Role_permission(
   id_role_permission UUID DEFAULT uuid_generate_v4(),
   id_role UUID NOT NULL,
   id_permission UUID NOT NULL,
   is_granted BOOLEAN DEFAULT TRUE,
   PRIMARY KEY(id_role_permission),
   UNIQUE(id_role, id_permission),
   FOREIGN KEY(id_role) REFERENCES role(id_role) ON DELETE CASCADE,
   FOREIGN KEY(id_permission) REFERENCES Permission(id_permission) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS User_tokens(
   id_token UUID DEFAULT uuid_generate_v4(),
   token VARCHAR(255) NOT NULL,
   token_type VARCHAR(30),
   expires_at TIMESTAMPTZ NOT NULL,
   used BOOLEAN DEFAULT FALSE,
   created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
   id_user UUID NOT NULL,
   PRIMARY KEY(id_token),
   UNIQUE(token),
   FOREIGN KEY(id_user) REFERENCES Users(id_user) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Audit_logs(
   id_audit UUID DEFAULT uuid_generate_v4(),
   entity_name VARCHAR(100) NOT NULL,
   entity_id UUID NOT NULL,
   action VARCHAR(50) NOT NULL,
   old_value JSONB,
   new_value JSONB,
   id_user UUID NOT NULL,
   created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY(id_audit),
   FOREIGN KEY(id_user) REFERENCES Users(id_user)
);

-- =========================================================================
-- 12. CHATBOT IA & BASE VECTORIELLE (RAG)
-- =========================================================================

CREATE TABLE IF NOT EXISTS chatbot_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    source TEXT NOT NULL,
    section TEXT,
    chunk_index INTEGER,
    embedding vector(768)
);

-- =========================================================================
-- 13. INDEX DE PERFORMANCE
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_spl_supplier_payment ON Supplier_payment_line(id_supplier_payment);
CREATE INDEX IF NOT EXISTS idx_chatbot_chunks_embedding ON chatbot_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_saler ON sales(id_saler);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(id_sale);
CREATE INDEX IF NOT EXISTS idx_sale_items_menu ON sale_items(id_menu);
CREATE INDEX IF NOT EXISTS idx_employees_code ON employees(employee_code);
CREATE INDEX IF NOT EXISTS idx_employees_job_employee ON employees_job(id_employee);
CREATE INDEX IF NOT EXISTS idx_schedules_employee_date ON schedules(id_employee, schedule_date);
CREATE INDEX IF NOT EXISTS idx_stock_movement_item ON stock_movement(id_item);
CREATE INDEX IF NOT EXISTS idx_stock_movement_date ON stock_movement(movement_date);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(id_supplier);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_supplier_payment_supplier ON supplier_payment(id_supplier);
CREATE INDEX IF NOT EXISTS idx_cash_movement_journal ON cash_movement(id_journal);
CREATE INDEX IF NOT EXISTS idx_leaves_employee ON leaves(id_employee);
CREATE INDEX IF NOT EXISTS idx_internship_employee ON internship(id_employee);
CREATE INDEX IF NOT EXISTS idx_internship_school ON internship(id_school);

-- =========================================================================
-- 14. VUES MÉTIER SÉMANTIQUES (POUR ANALYTICS, REPORTING & CHATBOT IA)
-- =========================================================================
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

-- =========================================================================
-- 15. DONNÉES DE BASE DE PRODUCTION (MASTER SEED DATA)
-- Ces données garantissent l'initialisation immédiate des fonctionnalités vitales de l'ERP.
-- =========================================================================

-- 15.1 Modes de paiement
INSERT INTO payment_method (id_payment_method, label, description) VALUES
  ('c460cf61-0000-0000-0000-000000000001', 'Espèces', 'Paiement en espèces'),
  ('c460cf61-0000-0000-0000-000000000002', 'Carte Bancaire', 'Paiement par carte bancaire'),
  ('c460cf61-0000-0000-0000-000000000003', 'Mobile Money', 'Paiement via mobile money (Airtel, Orange, Mvola)')
ON CONFLICT (id_payment_method) DO UPDATE SET label = EXCLUDED.label, description = EXCLUDED.description;

-- 15.2 Catégories de permissions
INSERT INTO permission_category (id_category, name, code) VALUES
  (uuid_generate_v4(), 'Navigation', 'navigation'),
  (uuid_generate_v4(), 'Restaurant', 'restaurant'),
  (uuid_generate_v4(), 'Logistique', 'logistique'),
  (uuid_generate_v4(), 'Ressources Humaines', 'ressources_humaines'),
  (uuid_generate_v4(), 'Sécurité', 'sécurité'),
  (uuid_generate_v4(), 'Configuration', 'configuration')
ON CONFLICT (code) DO NOTHING;

-- 15.3 Catalogue des permissions
INSERT INTO permission (id_permission, name, code, description, id_category)
SELECT uuid_generate_v4(), v.name, v.code, v.description, c.id_category
FROM (VALUES
  ('Accès au module Hôtel', 'hotel.access', 'Permet d''accéder au module hôtel', 'navigation'),
  ('Accès au module Restaurant', 'restaurant.access', 'Permet d''accéder au module restaurant', 'navigation'),
  ('Caisse & PDV', 'restaurant.pos', 'Accès au point de vente restaurant', 'restaurant'),
  ('Caisse & Ventes (Voir, Créer, Modifier)', 'sales.pos', 'Créer et modifier les commandes et encaissements', 'restaurant'),
  ('Gérer les ventes (Rouvrir, Annuler, Supprimer)', 'sale.manage', 'Gestion avancée des tickets et ventes', 'restaurant'),
  ('Achats & Dépenses', 'restaurant.purchases', 'Suivi des achats de matières premières et dépenses', 'restaurant'),
  ('Accès Inventaire', 'stock.access', 'Accès à la gestion des inventaires', 'logistique'),
  ('Voir les stocks', 'stock.read', 'Consulter les niveaux et mouvements de stock', 'logistique'),
  ('Gérer les stocks', 'stock.manage', 'Effectuer des ajustements et réceptions de stock', 'logistique'),
  ('Audits & Alertes', 'stock.audit', 'Consulter les anomalies et audits de stock', 'logistique'),
  ('Prévisions IA', 'stock.forecast', 'Accès aux prédictions de réapprovisionnement IA', 'logistique'),
  ('Gérer les Fournisseurs', 'supplier.manage', 'Créer et administrer la liste des fournisseurs', 'logistique'),
  ('Accès Ressources Humaines', 'hr.access', 'Accès au portail RH et plannings', 'ressources_humaines'),
  ('Gérer les RH (Postes, Équipes)', 'hr.manage', 'Gérer l''organisation, les postes et affectations', 'ressources_humaines'),
  ('Bien-être de l''équipe', 'hr.welfare', 'Suivi des congés et du bien-être du personnel', 'ressources_humaines'),
  ('Gérer les employés', 'employee.manage', 'Créer et modifier les fiches employés', 'ressources_humaines'),
  ('Supprimer un employé', 'employee.delete', 'Désactiver ou supprimer un compte employé', 'ressources_humaines'),
  ('Gestion de la sécurité (Accès, Rôles, Clés)', 'security.access', 'Accès aux paramètres de sécurité et utilisateurs', 'sécurité'),
  ('Voir les rôles', 'role.read', 'Consulter les profils et rôles existants', 'sécurité'),
  ('Créer un rôle', 'role.create', 'Créer de nouveaux rôles utilisateurs', 'sécurité'),
  ('Modifier un rôle', 'role.update', 'Ajuster les permissions associées à un rôle', 'sécurité'),
  ('Supprimer un rôle', 'role.delete', 'Supprimer un rôle non assigné', 'sécurité'),
  ('Voir les permissions', 'permission.read', 'Consulter la grille complète des permissions', 'sécurité'),
  ('Créer une permission', 'permission.create', 'Ajouter une permission au catalogue', 'sécurité'),
  ('Modifier une permission', 'permission.update', 'Mettre à jour l''intitulé d''une permission', 'sécurité'),
  ('Supprimer une permission', 'permission.delete', 'Retirer une permission obsolète', 'sécurité'),
  ('Accès Paramètres', 'settings.access', 'Consulter et ajuster les paramètres généraux', 'configuration'),
  ('Gérer les informations de l''entreprise', 'manager.info', 'Mettre à jour l''identité et les coordonnées de l''établissement', 'configuration')
) AS v(name, code, description, cat_code)
JOIN permission_category c ON c.code = v.cat_code
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 15.4 Rôles système standard
INSERT INTO role (id_role, label, description) VALUES
  (uuid_generate_v4(), 'Admin', 'Administrateur système - Accès intégral à tous les modules'),
  (uuid_generate_v4(), 'Manager', 'Responsable d''établissement - Pilotage des ventes, stocks, RH et configuration'),
  (uuid_generate_v4(), 'Chef cuisinier', 'Responsable cuisine - Gestion des stocks, inventaires, fiches recettes et production'),
  (uuid_generate_v4(), 'Caissier', 'Personnel de caisse - Enregistrement des ventes, encaissements et consultation des stocks'),
  (uuid_generate_v4(), 'default', 'Profil standard - Accès restreint aux opérations autorisées')
ON CONFLICT (label) DO UPDATE SET description = EXCLUDED.description;

-- 15.5 Affectation des permissions aux rôles standard
-- Rôle : Admin
INSERT INTO role_permission (id_role_permission, id_role, id_permission, is_granted)
SELECT uuid_generate_v4(), r.id_role, p.id_permission, true
FROM role r
JOIN permission p ON p.code IN ('hotel.access', 'restaurant.access', 'restaurant.pos', 'sales.pos', 'sale.manage', 'restaurant.purchases', 'stock.access', 'stock.read', 'stock.manage', 'stock.audit', 'stock.forecast', 'supplier.manage', 'hr.access', 'hr.manage', 'hr.welfare', 'employee.manage', 'employee.delete', 'security.access', 'role.read', 'role.create', 'role.update', 'role.delete', 'permission.read', 'permission.create', 'permission.update', 'permission.delete', 'settings.access', 'manager.info')
WHERE r.label = 'Admin'
ON CONFLICT (id_role, id_permission) DO NOTHING;

-- Rôle : Manager
INSERT INTO role_permission (id_role_permission, id_role, id_permission, is_granted)
SELECT uuid_generate_v4(), r.id_role, p.id_permission, true
FROM role r
JOIN permission p ON p.code IN ('hotel.access', 'restaurant.access', 'restaurant.pos', 'sales.pos', 'sale.manage', 'restaurant.purchases', 'stock.access', 'stock.read', 'stock.manage', 'stock.audit', 'stock.forecast', 'supplier.manage', 'hr.access', 'hr.manage', 'hr.welfare', 'employee.manage', 'settings.access', 'manager.info', 'role.read', 'permission.read')
WHERE r.label = 'Manager'
ON CONFLICT (id_role, id_permission) DO NOTHING;

-- Rôle : Chef cuisinier
INSERT INTO role_permission (id_role_permission, id_role, id_permission, is_granted)
SELECT uuid_generate_v4(), r.id_role, p.id_permission, true
FROM role r
JOIN permission p ON p.code IN ('restaurant.access', 'stock.access', 'stock.read', 'stock.manage', 'stock.audit', 'stock.forecast', 'restaurant.purchases', 'supplier.manage')
WHERE r.label = 'Chef cuisinier'
ON CONFLICT (id_role, id_permission) DO NOTHING;

-- Rôle : Caissier
INSERT INTO role_permission (id_role_permission, id_role, id_permission, is_granted)
SELECT uuid_generate_v4(), r.id_role, p.id_permission, true
FROM role r
JOIN permission p ON p.code IN ('restaurant.access', 'restaurant.pos', 'sales.pos', 'sale.manage', 'stock.read', 'stock.manage', 'supplier.manage', 'hotel.access', 'restaurant.purchases')
WHERE r.label = 'Caissier'
ON CONFLICT (id_role, id_permission) DO NOTHING;

-- Rôle : default
INSERT INTO role_permission (id_role_permission, id_role, id_permission, is_granted)
SELECT uuid_generate_v4(), r.id_role, p.id_permission, true
FROM role r
JOIN permission p ON p.code IN ('restaurant.access', 'sales.pos', 'stock.read')
WHERE r.label = 'default'
ON CONFLICT (id_role, id_permission) DO NOTHING;

-- 15.6 Types de contrats de travail
INSERT INTO employment_type (id_employment_type, label, description) VALUES
  (uuid_generate_v4(), 'CDI', 'Contrat à Durée Indéterminée'),
  (uuid_generate_v4(), 'CDD', 'Contrat à Durée Déterminée'),
  (uuid_generate_v4(), 'Stage', 'Convention de stage école / entreprise'),
  (uuid_generate_v4(), 'Alternance', 'Contrat d''apprentissage ou de professionnalisation'),
  (uuid_generate_v4(), 'Freelance', 'Prestataire ou vacataire indépendant')
ON CONFLICT (label) DO NOTHING;

-- 15.7 Types de congés légaux
INSERT INTO leave_types (id_leave_type, label, is_paid, requires_proof, deduction_mode, cap, cap_period) VALUES
  (uuid_generate_v4(), 'Congé Payé', true, false, 'ALWAYS', 25, 'ANNUAL'),
  (uuid_generate_v4(), 'Congé Maladie', true, true, 'ALWAYS', 15, 'ANNUAL'),
  (uuid_generate_v4(), 'Congé Maternité / Paternité', true, true, 'NEVER', 90, 'LIFETIME'),
  (uuid_generate_v4(), 'Congé Événement Familial / Exceptionnel', true, true, 'NEVER', 5, 'ANNUAL'),
  (uuid_generate_v4(), 'Congé Sans Solde', false, false, 'ALWAYS', 30, 'ANNUAL'),
  (uuid_generate_v4(), 'Récupération d''Heures Supplémentaires', true, false, 'OPTIONAL', 10, 'ANNUAL')
ON CONFLICT (label) DO NOTHING;

-- 15.8 Unités de mesure courantes
INSERT INTO unit_of_measure (id_unit, label, symbol) VALUES
  (uuid_generate_v4(), 'Kilogramme', 'kg'),
  (uuid_generate_v4(), 'Gramme', 'g'),
  (uuid_generate_v4(), 'Milligramme', 'mg'),
  (uuid_generate_v4(), 'Litre', 'L'),
  (uuid_generate_v4(), 'Centilitre', 'cl'),
  (uuid_generate_v4(), 'Millilitre', 'ml'),
  (uuid_generate_v4(), 'Pièce', 'pc'),
  (uuid_generate_v4(), 'Portion', 'portion'),
  (uuid_generate_v4(), 'Bouteille', 'btl'),
  (uuid_generate_v4(), 'Canette', 'can'),
  (uuid_generate_v4(), 'Boîte / Conserve', 'bte'),
  (uuid_generate_v4(), 'Carton', 'ctn')
ON CONFLICT DO NOTHING;

-- 15.9 Catégories de mouvements de caisse
INSERT INTO cash_movement_category (id_cash_movement_category, label, allowed_direction) VALUES
  (uuid_generate_v4(), 'Fond de caisse initial', 5),
  (uuid_generate_v4(), 'Encaissement Vente Restaurant & Bar', 5),
  (uuid_generate_v4(), 'Encaissement Séjour & Hébergement', 5),
  (uuid_generate_v4(), 'Apport de trésorerie / Dépôt gérant', 5),
  (uuid_generate_v4(), 'Remboursement avance employé', 5),
  (uuid_generate_v4(), 'Petite dépense urgente cuisine / marché', -5),
  (uuid_generate_v4(), 'Dépôt en banque / Versement coffre', -5),
  (uuid_generate_v4(), 'Avance sur salaire employé', -5),
  (uuid_generate_v4(), 'Paiement fournisseur au comptant', -5),
  (uuid_generate_v4(), 'Frais de transport & courses urgentes', -5),
  (uuid_generate_v4(), 'Ajustement / Écart de caisse', 0)
ON CONFLICT (label) DO NOTHING;

-- 15.10 Types d'hébergement / chambres
INSERT INTO room_type (id_room_type, label, description) VALUES
  (uuid_generate_v4(), 'Chambre Standard Simple', '1 personne, lit simple, climatisation, salle d''eau, WiFi'),
  (uuid_generate_v4(), 'Chambre Standard Double', '2 personnes, lit Queen size, salle de bain privée, climatisation, WiFi'),
  (uuid_generate_v4(), 'Chambre Supérieure King', '2 personnes, lit King size, balcon vue jardin, salon, coffre-fort'),
  (uuid_generate_v4(), 'Suite Junior', '2 à 3 personnes, grand lit, coin salon spacieux, plateau de courtoisie'),
  (uuid_generate_v4(), 'Suite Deluxe Familiale', '4 personnes, 2 chambres, terrasse panoramique, baignoire balnéo')
ON CONFLICT (label) DO NOTHING;

-- 15.11 Catégories de carte / restaurant
INSERT INTO menu_categories (id_category, label, description) VALUES
  (uuid_generate_v4(), 'Entrées & Salades Fraîches', 'Entrées gourmandes, carpaccios et salades du chef'),
  (uuid_generate_v4(), 'Plats Chauds & Spécialités Maison', 'Viandes, poissons grillés et spécialités culinaires'),
  (uuid_generate_v4(), 'Burgers Maison & Snacks', 'Burgers gourmets, frites et encas rapides'),
  (uuid_generate_v4(), 'Desserts & Pâtisseries', 'Desserts faits maison, glaces artisanales'),
  (uuid_generate_v4(), 'Boissons Rafraîchissantes & Sodas', 'Sodas, eaux minérales et jus de fruits frais'),
  (uuid_generate_v4(), 'Bières & Vins', 'Bières locales, sélection de vins et spiritueux'),
  (uuid_generate_v4(), 'Cafés & Thés', 'Cafés arabica, thés fins et infusions')
ON CONFLICT (label) DO NOTHING;

-- 15.12 Postes et métiers de l'établissement
INSERT INTO job_titles (id_job_title, title) VALUES
  (uuid_generate_v4(), 'Directeur d''Exploitation / Gérant'),
  (uuid_generate_v4(), 'Chef Cuisinier'),
  (uuid_generate_v4(), 'Second de Cuisine'),
  (uuid_generate_v4(), 'Commis de Cuisine'),
  (uuid_generate_v4(), 'Responsable de Salle / Maître d''Hôtel'),
  (uuid_generate_v4(), 'Serveur / Serveuse'),
  (uuid_generate_v4(), 'Barman / Mixologue'),
  (uuid_generate_v4(), 'Caissier / Caissière'),
  (uuid_generate_v4(), 'Réceptionniste'),
  (uuid_generate_v4(), 'Femme / Valet de Chambre'),
  (uuid_generate_v4(), 'Agent de Sécurité & Surveillance'),
  (uuid_generate_v4(), 'Responsable Économat & Stocks')
ON CONFLICT DO NOTHING;

-- 15.13 Types de shifts de travail
INSERT INTO shift_type (id_shift_type, label, custom_start_time, custom_end_time, start_time, end_time, description) VALUES
  (uuid_generate_v4(), 'Shift Matin', '06:00:00', '14:30:00', '06:00:00', '14:30:00', 'Service petit-déjeuner et préparation du midi'),
  (uuid_generate_v4(), 'Shift Continu Jour', '08:00:00', '16:30:00', '08:00:00', '16:30:00', 'Administration, économat, stocks et maintenance'),
  (uuid_generate_v4(), 'Shift Après-midi', '12:00:00', '20:30:00', '12:00:00', '20:30:00', 'Renfort déjeuner et préparation du dîner'),
  (uuid_generate_v4(), 'Shift Soir', '14:00:00', '22:30:00', '14:00:00', '22:30:00', 'Service dîner, bar et fermeture restaurant'),
  (uuid_generate_v4(), 'Shift Coupure', '10:00:00', '22:30:00', '10:00:00', '22:30:00', 'Coupure service midi (10h-14h30) et soir (18h30-22h30)'),
  (uuid_generate_v4(), 'Shift Nuit', '22:00:00', '06:30:00', '22:00:00', '06:30:00', 'Permanence nocturne hôtel, sécurité et veille de nuit')
ON CONFLICT DO NOTHING;

-- 15.14 Équipes de travail
INSERT INTO team (id_team, team_name, description) VALUES
  (uuid_generate_v4(), 'Équipe A', 'Équipe A - Service de Jour & Direction'),
  (uuid_generate_v4(), 'Équipe B', 'Équipe B - Service de Soir & Bar'),
  (uuid_generate_v4(), 'Équipe C', 'Équipe C - Logistique, Exploitation & Cuisine')
ON CONFLICT (team_name) DO NOTHING;

-- =========================================================================
-- FIN DU SCRIPT D'INITIALISATION DE PRODUCTION
-- =========================================================================
`;
    await queryRunner.query(sql);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const sql = `
-- Drop Views
DROP VIEW IF EXISTS v_employees_active CASCADE;
DROP VIEW IF EXISTS v_stock_alerts CASCADE;
DROP VIEW IF EXISTS v_supplier_catalog CASCADE;
DROP VIEW IF EXISTS v_supplier_debts CASCADE;
DROP VIEW IF EXISTS v_recipe_ingredients CASCADE;
DROP VIEW IF EXISTS v_recipes CASCADE;
DROP VIEW IF EXISTS v_menu_sales CASCADE;
DROP VIEW IF EXISTS v_sellers CASCADE;

-- Drop Tables in reverse dependency order
DROP TABLE IF EXISTS chatbot_chunks CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS user_tokens CASCADE;
DROP TABLE IF EXISTS role_permission CASCADE;
DROP TABLE IF EXISTS user_role CASCADE;
DROP TABLE IF EXISTS user_permission CASCADE;
DROP TABLE IF EXISTS product_price CASCADE;
DROP TABLE IF EXISTS payment CASCADE;
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS invoice CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS room CASCADE;
DROP TABLE IF EXISTS dish_production CASCADE;
DROP TABLE IF EXISTS recipe_details CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS event CASCADE;
DROP TABLE IF EXISTS employee_availabilities CASCADE;
DROP TABLE IF EXISTS employees_job CASCADE;
DROP TABLE IF EXISTS employee_leave_balances CASCADE;
DROP TABLE IF EXISTS leave_transactions CASCADE;
DROP TABLE IF EXISTS leaves CASCADE;
DROP TABLE IF EXISTS employee_requirements CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS employee_team CASCADE;
DROP TABLE IF EXISTS employment_type CASCADE;
DROP TABLE IF EXISTS payment_method_balance CASCADE;
DROP TABLE IF EXISTS cash_movement CASCADE;
DROP TABLE IF EXISTS cash_movement_category CASCADE;
DROP TABLE IF EXISTS cash_journal CASCADE;
DROP TABLE IF EXISTS stock_movement CASCADE;
DROP TABLE IF EXISTS supplier_balance CASCADE;
DROP TABLE IF EXISTS supplier_payment_line CASCADE;
DROP TABLE IF EXISTS supplier_payment_allocation CASCADE;
DROP TABLE IF EXISTS supplier_payment CASCADE;
DROP TABLE IF EXISTS purchase_delivery CASCADE;
DROP TABLE IF EXISTS delivery_details CASCADE;
DROP TABLE IF EXISTS product_delivery CASCADE;
DROP TABLE IF EXISTS purchase_details CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS item_unit CASCADE;
DROP TABLE IF EXISTS supplied_items CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS supplier_products_price CASCADE;
DROP TABLE IF EXISTS supplier_products CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS internship CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS supplier CASCADE;
DROP TABLE IF EXISTS schools CASCADE;
DROP TABLE IF EXISTS menu_categories CASCADE;
DROP TABLE IF EXISTS team CASCADE;
DROP TABLE IF EXISTS shift_type CASCADE;
DROP TABLE IF EXISTS leave_types CASCADE;
DROP TABLE IF EXISTS room_type CASCADE;
DROP TABLE IF EXISTS payment_method CASCADE;
DROP TABLE IF EXISTS unit_of_measure CASCADE;
DROP TABLE IF EXISTS item_type CASCADE;
DROP TABLE IF EXISTS permission CASCADE;
DROP TABLE IF EXISTS permission_category CASCADE;
DROP TABLE IF EXISTS role CASCADE;
DROP TABLE IF EXISTS job_titles CASCADE;

-- Drop Sequences
DROP SEQUENCE IF EXISTS payment_ref_seq CASCADE;
DROP SEQUENCE IF EXISTS sale_ref_seq CASCADE;
DROP SEQUENCE IF EXISTS invoice_ref_seq CASCADE;
DROP SEQUENCE IF EXISTS menu_item_ref_seq CASCADE;
DROP SEQUENCE IF EXISTS dish_production_ref_seq CASCADE;
DROP SEQUENCE IF EXISTS leave_ref_seq CASCADE;
DROP SEQUENCE IF EXISTS cash_movement_ref_seq CASCADE;
DROP SEQUENCE IF EXISTS journal_ref_seq CASCADE;
DROP SEQUENCE IF EXISTS stock_mvmt_ref_seq CASCADE;
DROP SEQUENCE IF EXISTS supplier_payment_ref_seq CASCADE;
DROP SEQUENCE IF EXISTS delivery_ref_seq CASCADE;
DROP SEQUENCE IF EXISTS purchase_ref_seq CASCADE;
DROP SEQUENCE IF EXISTS item_ref_seq CASCADE;
DROP SEQUENCE IF EXISTS supplier_product_ref_seq CASCADE;
DROP SEQUENCE IF EXISTS user_ref_seq CASCADE;
DROP SEQUENCE IF EXISTS employee_ref_seq CASCADE;
DROP SEQUENCE IF EXISTS supplier_ref_seq CASCADE;
`;
    await queryRunner.query(sql);
  }
}
