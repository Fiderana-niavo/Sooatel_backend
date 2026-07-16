create database sooatel;
\c sooatel

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- CONFIGURATIONS ET PARAMÈTRES 
-- =========================================================================

CREATE TABLE Job_titles(
   id_job_title UUID DEFAULT uuid_generate_v4(),
   title VARCHAR(100) ,
   PRIMARY KEY(id_job_title)
);

CREATE TABLE role(
   id_role UUID DEFAULT uuid_generate_v4(),
   label VARCHAR(50)  NOT NULL,
   description VARCHAR(255) ,
   PRIMARY KEY(id_role),
   UNIQUE(label)
);

CREATE TABLE permission_category(
   id_category UUID DEFAULT uuid_generate_v4(),
   name VARCHAR(100) NOT NULL UNIQUE, -- ex: "Vente & Caisse", "Stocks"
   code VARCHAR(50) NOT NULL UNIQUE,  -- ex: "SALE", "STOCK" 
   PRIMARY KEY(id_category)
);

CREATE TABLE Permission(
   id_permission UUID DEFAULT uuid_generate_v4(),
   permission_name VARCHAR(50)  NOT NULL,
   description VARCHAR(100) ,
   id_category UUID NOT NULL,
   PRIMARY KEY(id_permission),
   UNIQUE(permission_name),
   FOREIGN KEY(id_category) REFERENCES permission_category(id_category)
);

CREATE TABLE Item_type(
   id_product_type UUID DEFAULT uuid_generate_v4(),
   label VARCHAR(100) ,
   description VARCHAR(255) ,
   PRIMARY KEY(id_product_type)
);

CREATE TABLE Unit_of_measure(
   id_unit UUID DEFAULT uuid_generate_v4(),
   label VARCHAR(50) ,
   symbol VARCHAR(10) ,
   PRIMARY KEY(id_unit)
);

CREATE TABLE Payment_method(
   id_payment_method UUID DEFAULT uuid_generate_v4(),
   label VARCHAR(50) ,
   description VARCHAR(50) ,
   PRIMARY KEY(id_payment_method)
);

CREATE TABLE Room_type(
   id_room_type UUID DEFAULT uuid_generate_v4(),
   label VARCHAR(50)  NOT NULL,
   Description VARCHAR(255) ,
   PRIMARY KEY(id_room_type),
   UNIQUE(label)
);

CREATE TABLE leave_types(
   id_leave_type UUID DEFAULT uuid_generate_v4(),
   label VARCHAR(50)  NOT NULL,
   is_paid BOOLEAN,
   requires_proof BOOLEAN,
   PRIMARY KEY(id_leave_type),
   UNIQUE(label)
);

CREATE TABLE Shift_type(
   id_shift_type UUID DEFAULT uuid_generate_v4(),
   label VARCHAR(50)  NOT NULL,
   custom_start_time TIME NOT NULL,
   custom_end_time TIME NOT NULL,
   description VARCHAR(255) ,
   PRIMARY KEY(id_shift_type)
);

CREATE TABLE Team(
   id_team UUID DEFAULT uuid_generate_v4(),
   team_name VARCHAR(70)  NOT NULL,
   description VARCHAR(100) ,
   UNIQUE(team_name),
   PRIMARY KEY(id_team)
);

CREATE TABLE Menu_categories(
   id_category UUID DEFAULT uuid_generate_v4(),
   label VARCHAR(100)  NOT NULL,
   description VARCHAR(255) ,
   PRIMARY KEY(id_category),
   UNIQUE(label)
);

-- =========================================================================
-- ACTEURS (Employés, Fournisseurs, Utilisateurs)
-- =========================================================================

CREATE SEQUENCE supplier_ref_seq;
CREATE TABLE Supplier(
   id_supplier UUID DEFAULT uuid_generate_v4(),
   ref VARCHAR(20) NOT NULL DEFAULT 'SUP' || to_char(nextval('supplier_ref_seq'), 'fm0000'),
   name VARCHAR(100)  NOT NULL,
   address VARCHAR(100),
   description VARCHAR(255) ,
   provides_delivery BOOLEAN,
   delivery_delay NUMERIC(5,2),
   notes VARCHAR(255) ,
   phone_number VARCHAR(20) ,
   email VARCHAR(100) ,
   PRIMARY KEY(id_supplier),
   UNIQUE(ref)
);

CREATE SEQUENCE employee_ref_seq;
CREATE TABLE Employees(
   id_employee UUID DEFAULT uuid_generate_v4(),
   employee_code VARCHAR(20) NOT NULL DEFAULT 'EMP' || to_char(nextval('employee_ref_seq'), 'fm0000'),
   name VARCHAR(100) ,
   lastname VARCHAR(100) ,
   birthdate DATE,
   address VARCHAR(255) ,
   email_contact VARCHAR(254) ,
   phone_number VARCHAR(20) ,
   notes VARCHAR(255) ,
   active_status INTEGER DEFAULT 0,
   PRIMARY KEY(id_employee),
   UNIQUE(employee_code),
   UNIQUE(email_contact),
   UNIQUE(phone_number),
   CONSTRAINT chk_name_or_lastname 
   CHECK (name IS NOT NULL OR lastname IS NOT NULL)
);

CREATE TABLE Internship(
   id_internship UUID DEFAULT uuid_generate_v4() ,
   school_name VARCHAR(100) ,
   academic_supervisor_name VARCHAR(255) ,
   professionnal_supervisor_name VARCHAR(255) ,
   id_employee UUID NOT NULL,
   PRIMARY KEY(id_internship),
   FOREIGN KEY(id_employee) REFERENCES Employees(id_employee)
);

CREATE SEQUENCE user_ref_seq;
CREATE TABLE Users(
   id_user UUID DEFAULT uuid_generate_v4(),
   ref VARCHAR(20) NOT NULL DEFAULT 'USR' || to_char(nextval('user_ref_seq'), 'fm0000'),
   username VARCHAR(254)  NOT NULL,
   password_hash VARCHAR(255) NOT NULL,
   active_status INTEGER NOT NULL DEFAULT 0,
   activated_at TIMESTAMPTZ,
   activated_from TIMESTAMPTZ,
   created_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   id_employee UUID NOT NULL,
   PRIMARY KEY(id_user),
   UNIQUE(username),
   UNIQUE(ref),
   FOREIGN KEY(id_employee) REFERENCES Employees(id_employee)
);

-- =========================================================================
-- PRODUITS ET ARTICLES
-- =========================================================================

CREATE SEQUENCE supplier_product_ref_seq;
CREATE TABLE Supplier_products(
   id_supplier_product UUID DEFAULT uuid_generate_v4(),
   ref VARCHAR(20) NOT NULL DEFAULT 'SPR' || to_char(nextval('supplier_product_ref_seq'), 'fm0000'),
   name VARCHAR(50) NOT NULL,
   actual_price NUMERIC(15,2) NOT NULL,
   min_purchase_number NUMERIC(10,2) NOT NULL DEFAULT 0,
   id_supplier UUID NOT NULL,
   notes VARCHAR(255),
   PRIMARY KEY(id_supplier_product),
   UNIQUE(ref),
   FOREIGN KEY(id_supplier) REFERENCES Supplier(id_supplier)
);

CREATE TABLE Supplier_products_price(
   id_supplier_product_price UUID DEFAULT uuid_generate_v4(),
   price NUMERIC(15,2) NOT NULL,
   change_date DATE NOT NULL,
   id_supplier_product UUID NOT NULL,
   PRIMARY KEY(id_supplier_product_price),
   FOREIGN KEY(id_supplier_product) REFERENCES Supplier_products(id_supplier_product)
);

CREATE SEQUENCE item_ref_seq;
CREATE TABLE Items(
   id_item UUID DEFAULT uuid_generate_v4(),
   ref VARCHAR(20) NOT NULL DEFAULT 'ART' || to_char(nextval('item_ref_seq'), 'fm0000'),
   label VARCHAR(100)  NOT NULL,
   is_produced BOOLEAN,
   quantity NUMERIC(15,2)  ,
   minimum_stock_level NUMERIC(15,2) NOT NULL DEFAULT 0,
   reorder_quantity NUMERIC(15,2)  ,
   is_perishable BOOLEAN NOT NULL DEFAULT FALSE,
   status INTEGER NOT NULL DEFAULT 0,
   id_product_type UUID NOT NULL,
   id_unit UUID NOT NULL,
   description VARCHAR(255) ,
   PRIMARY KEY(id_item),
   UNIQUE(label),
   UNIQUE(ref),
   FOREIGN KEY(id_product_type) REFERENCES Item_type(id_product_type),
   FOREIGN KEY(id_unit) REFERENCES Unit_of_measure(id_unit)
);

CREATE TABLE Supplied_Items(
   id_supplied_item UUID DEFAULT uuid_generate_v4(),
--    purchase_price NUMERIC(10,2) ,
   id_item UUID NOT NULL,
   id_supplier_product UUID NOT NULL,
   PRIMARY KEY(id_supplied_item),
   FOREIGN KEY(id_item) REFERENCES Items(id_item),
   FOREIGN KEY(id_supplier_product) REFERENCES Supplier_products(id_supplier_product)
);

CREATE TABLE Item_unit(
   id_item_unit UUID DEFAULT uuid_generate_v4(),
   to_stock_ratio NUMERIC(15,6)  NOT NULL,
   alternative_unit UUID NOT NULL, --the unit used to create different alternative of unit for a same product
   id_item UUID NOT NULL,
   PRIMARY KEY(id_item_unit),
   FOREIGN KEY(alternative_unit) REFERENCES Unit_of_measure(id_unit),
   FOREIGN KEY(id_item) REFERENCES Items(id_item)
);

-- =========================================================================
-- LOGISTIQUE ET FLUX (Achats, Ventes, Stocks)
-- =========================================================================

CREATE SEQUENCE purchase_ref_seq;
CREATE TABLE Purchases(
   id_purchase UUID DEFAULT uuid_generate_v4(),
   ref VARCHAR(20) NOT NULL DEFAULT 'ACH' || to_char(nextval('purchase_ref_seq'), 'fm0000'),
   purchase_date DATE NOT NULL,
   total_amount NUMERIC(15,2),
   balance_due NUMERIC(15,2),
   id_supplier UUID NOT NULL,
   id_purchaser UUID NOT NULL,
   PRIMARY KEY(id_purchase), --the employee in charge of the purchase
   UNIQUE(ref),
   FOREIGN KEY(id_supplier) REFERENCES Supplier(id_supplier),
   FOREIGN KEY(id_purchaser) REFERENCES Employees(id_employee)
);

CREATE TABLE Purchase_details(
   id_purchase_detail UUID DEFAULT uuid_generate_v4(),
   id_purchase UUID NOT NULL,
   id_supplier_product UUID NOT NULL,
   quantity NUMERIC(10,2)   NOT NULL,
   unit_price NUMERIC(15,2),
   total_amount NUMERIC(15,2),
   PRIMARY KEY(id_purchase_detail),
   FOREIGN KEY(id_supplier_product) REFERENCES Supplier_products(id_supplier_product),
   FOREIGN KEY(id_purchase) REFERENCES Purchases(id_purchase)
);

CREATE SEQUENCE purchase_payment_ref_seq;
CREATE TABLE Purchase_payment(
   id_purchase_payment UUID DEFAULT uuid_generate_v4(),
   ref VARCHAR(20) NOT NULL DEFAULT 'REG_ACH' || to_char(nextval('purchase_payment_ref_seq'), 'fm0000'),
   id_purchase UUID NOT NULL,
   payment_date DATE NOT NULL,
   amount NUMERIC(15,2),
   id_processed_by UUID NOT NULL, --the employee in charge of the payment 
   id_payment_method UUID NOT NULL,
   PRIMARY KEY(id_purchase_payment),
   UNIQUE(ref),
   FOREIGN KEY(id_processed_by) REFERENCES Employees(id_employee),
   FOREIGN KEY(id_payment_method) REFERENCES Payment_method(id_payment_method),
   FOREIGN KEY(id_purchase) REFERENCES Purchases(id_purchase)
);

CREATE SEQUENCE stock_mvmt_ref_seq;
CREATE TABLE Stock_movement(
   id_stock_movement UUID DEFAULT uuid_generate_v4(),
   ref VARCHAR(20) NOT NULL DEFAULT 'MVT' || to_char(nextval('stock_mvmt_ref_seq'), 'fm0000'),
   id_item UUID NOT NULL,
   movement_date TIMESTAMPTZ,
   quantity NUMERIC(15,2)   NOT NULL,
   movement_type INTEGER,
   id_operator UUID NOT NULL, --the employee in charge of the stock movement
   PRIMARY KEY(id_stock_movement),
   UNIQUE(ref),
   FOREIGN KEY(id_item) REFERENCES Items(id_item),
   FOREIGN KEY(id_operator) REFERENCES Employees(id_employee)
);

-- =========================================================================
-- FINANCES (Journaux de caisse, Sorties)
-- =========================================================================

CREATE SEQUENCE journal_ref_seq;
CREATE TABLE Cash_journal(
   id_journal UUID DEFAULT uuid_generate_v4(),
   ref VARCHAR(20) NOT NULL DEFAULT 'JRN' || to_char(nextval('journal_ref_seq'), 'fm0000'),
   journal_opening TIMESTAMPTZ NOT NULL,
   journal_closing TIMESTAMPTZ,
   expected_closing_balance NUMERIC(15,2) NOT NULL, --the value that is supposed to do in the caisse
   actual_closing_balance NUMERIC(15,2), --the real value in the caisse
   cash_discrepancy NUMERIC(15,2), --the diff value between the real and the calculate
   id_cashier UUID NOT NULL, --the employee who create the journal 
   PRIMARY KEY(id_journal),
   UNIQUE(ref),
   FOREIGN KEY(id_cashier) REFERENCES Employees(id_employee)
);

CREATE SEQUENCE cash_outflow_ref_seq;
CREATE TABLE Cash_outflows(
   id_cash_outflows UUID DEFAULT uuid_generate_v4(),
   ref VARCHAR(20) NOT NULL DEFAULT 'DEP' || to_char(nextval('cash_outflow_ref_seq'), 'fm0000'),
   amount NUMERIC(15,2) NOT NULL,
   outflow_date DATE,
   reason VARCHAR(255) ,
   invoice_reference VARCHAR(100) ,
   id_processed_by UUID NOT NULL,--The employee who processed the cash outflow 
   id_journal UUID NOT NULL,
   status INTEGER,
   PRIMARY KEY(id_cash_outflows),
   UNIQUE(ref),
   FOREIGN KEY(id_processed_by) REFERENCES Employees(id_employee),
   FOREIGN KEY(id_journal) REFERENCES Cash_journal(id_journal)
);

-- =========================================================================
-- RH (Plannings, Présences, Congés)
-- =========================================================================

CREATE TABLE Employment_type(
   id_employment_type UUID DEFAULT uuid_generate_v4(),
   label VARCHAR(50)  NOT NULL,
   description VARCHAR(255) ,
   PRIMARY KEY(id_employment_type)
);

CREATE TABLE Employee_team(
   id_employee_team UUID DEFAULT uuid_generate_v4(),
   id_team UUID NOT NULL,
   id_employee UUID NOT NULL,
   PRIMARY KEY(id_employee_team),
   UNIQUE(id_team, id_employee),
   FOREIGN KEY(id_team) REFERENCES Team(id_team),
   FOREIGN KEY(id_employee) REFERENCES Employees(id_employee)
);

CREATE TABLE Schedules(
   id_schedule UUID DEFAULT uuid_generate_v4(),
   schedule_date DATE,
   custom_start_time TIME,
   custom_end_time TIME,
   id_shift_type UUID,
   id_employee UUID NOT NULL,
   PRIMARY KEY(id_schedule),
   FOREIGN KEY(id_shift_type) REFERENCES Shift_type(id_shift_type),
   FOREIGN KEY(id_employee) REFERENCES Employees(id_employee),
   CONSTRAINT chk_schedule_time_or_shift 
    CHECK (
    (id_shift_type IS NOT NULL AND custom_start_time IS NULL AND custom_end_time IS NULL) OR
    (id_shift_type IS NULL AND custom_start_time IS NOT NULL AND custom_end_time IS NOT NULL)
    )
);

CREATE TABLE Employee_requirements(
   id_requirement UUID DEFAULT uuid_generate_v4(),
   day_of_week INTEGER,
   required_count INTEGER NOT NULL,
   id_shift_type UUID NOT NULL, --we create a shift type in the database, to refer to all the shift
   id_job_title UUID NOT NULL,
   PRIMARY KEY(id_requirement),
   FOREIGN KEY(id_shift_type) REFERENCES Shift_type(id_shift_type),
   FOREIGN KEY(id_job_title) REFERENCES Job_titles(id_job_title)
);

CREATE TABLE Attendances(
   id_attendance UUID DEFAULT uuid_generate_v4(),
   clock_in TIMESTAMPTZ NOT NULL,
   clock_out TIMESTAMPTZ,
   id_schedule UUID NOT NULL,
   id_employee UUID NOT NULL,
   PRIMARY KEY(id_attendance),
   FOREIGN KEY(id_schedule) REFERENCES Schedules(id_schedule),
   FOREIGN KEY(id_employee) REFERENCES Employees(id_employee)
);

CREATE SEQUENCE leave_ref_seq;
CREATE TABLE Leaves(
   id_leave UUID DEFAULT uuid_generate_v4(),
   ref VARCHAR(20) NOT NULL DEFAULT 'CONG' || to_char(nextval('leave_ref_seq'), 'fm0000'),
   start_date TIMESTAMPTZ NOT NULL,
   end_date TIMESTAMPTZ NOT NULL,
   leave_unit VARCHAR(10) ,
   id_employee UUID NOT NULL,
   id_leave_type UUID NOT NULL,
   status INTEGER,
   PRIMARY KEY(id_leave),
   UNIQUE(ref),
   FOREIGN KEY(id_employee) REFERENCES Employees(id_employee),
   FOREIGN KEY(id_leave_type) REFERENCES leave_types(id_leave_type)
);

CREATE TABLE Leave_transactions(
   id_transaction UUID DEFAULT uuid_generate_v4(),
   transaction_type VARCHAR(20)  NOT NULL,
   amount NUMERIC(5,2)  ,
   created_at TIMESTAMPTZ,
   id_leave_type UUID NOT NULL,
   id_employee UUID NOT NULL,
   PRIMARY KEY(id_transaction),
   FOREIGN KEY(id_leave_type) REFERENCES leave_types(id_leave_type),
   FOREIGN KEY(id_employee) REFERENCES Employees(id_employee)
);

CREATE TABLE Employee_leave_balances(
   id_employee_leave_balance UUID DEFAULT uuid_generate_v4(),
   allocated_days INTEGER NOT NULL DEFAULT 0,
   used_days INTEGER,
   id_employee UUID NOT NULL,
   id_leave_type UUID NOT NULL,
   PRIMARY KEY(id_employee_leave_balance),
   FOREIGN KEY(id_employee) REFERENCES Employees(id_employee),
   FOREIGN KEY(id_leave_type) REFERENCES leave_types(id_leave_type)
);

CREATE TABLE Employees_job(
   id_emp_job UUID DEFAULT uuid_generate_v4(),
   assignment_date DATE,
   end_date DATE,
   has_fixed_schedule BOOLEAN,
   id_employment_type UUID NOT NULL,
   id_employee UUID NOT NULL,
   id_job_title UUID NOT NULL,
   PRIMARY KEY(id_emp_job),
   FOREIGN KEY(id_employment_type) REFERENCES Employment_type(id_employment_type),
   FOREIGN KEY(id_employee) REFERENCES Employees(id_employee),
   FOREIGN KEY(id_job_title) REFERENCES Job_titles(id_job_title)
);

CREATE TABLE Employee_availabilities(
   id_availability UUID DEFAULT uuid_generate_v4(),
   day_of_week INTEGER,
   custom_start_time TIME,
   custom_end_time TIME,
   id_shift_type UUID,
   id_emp_job UUID NOT NULL,
   PRIMARY KEY(id_availability),
   FOREIGN KEY(id_shift_type) REFERENCES Shift_type(id_shift_type),
   FOREIGN KEY(id_emp_job) REFERENCES Employees_job(id_emp_job),
   CONSTRAINT chk_schedule_time_or_shift_avai
    CHECK (
    (id_shift_type IS NOT NULL AND custom_start_time IS NULL AND custom_end_time IS NULL) OR
    (id_shift_type IS NULL AND custom_start_time IS NOT NULL AND custom_end_time IS NOT NULL)
    )
);

-- =========================================================================
-- RESTAURATION / PRODUCTIONS ET MENUS
-- =========================================================================

CREATE TABLE Event(
   id_event UUID DEFAULT uuid_generate_v4(),
   event_name VARCHAR(50) ,
   start_date DATE NOT NULL,
   end_date DATE,
   PRIMARY KEY(id_event)
);

CREATE TABLE Recipes(
   id_recipe UUID DEFAULT uuid_generate_v4(),
   id_parent UUID NOT NULL,
   id_ingredient UUID NOT NULL,
   quantity NUMERIC(15,2)   NOT NULL,
   cost NUMERIC(15,2)  ,
   id_item_unit UUID NOT NULL,
   PRIMARY KEY(id_recipe),
   FOREIGN KEY(id_item_unit) REFERENCES Item_unit(id_item_unit),
   FOREIGN KEY(id_parent) REFERENCES Items(id_item),
   FOREIGN KEY(id_ingredient) REFERENCES Items(id_item)
);

CREATE TABLE Dish_production(
   id_dish_production UUID DEFAULT uuid_generate_v4(),
   id_item UUID NOT NULL,
   production_date TIMESTAMPTZ NOT NULL,
   quantity NUMERIC(15,2)  ,
   PRIMARY KEY(id_dish_production),
   FOREIGN KEY(id_item) REFERENCES Items(id_item)
);

CREATE TABLE Room(
   id_room UUID DEFAULT uuid_generate_v4(),
   room_number VARCHAR(50)  NOT NULL,
   id_room_type UUID NOT NULL,
   description VARCHAR(255) ,
   PRIMARY KEY(id_room),
   UNIQUE(room_number),
   FOREIGN KEY(id_room_type) REFERENCES Room_type(id_room_type)
);

CREATE SEQUENCE menu_item_ref_seq;
CREATE TABLE Menu_Items(
   id_menu UUID DEFAULT uuid_generate_v4(),
   ref VARCHAR(20) NOT NULL DEFAULT 'MNU' || to_char(nextval('menu_item_ref_seq'), 'fm0000'),
   id_item UUID NOT NULL,
   sale_price NUMERIC(10,2)   NOT NULL,
   recipe_cost NUMERIC(10,2)  ,
   id_category UUID NOT NULL, --breakfast? Lunch ?
   PRIMARY KEY(id_menu),
   UNIQUE(ref),
   FOREIGN KEY(id_item) REFERENCES Items(id_item),
   FOREIGN KEY(id_category) REFERENCES Menu_categories(id_category)
);

-- =========================================================================
-- VENTES ET FACTURATION
-- =========================================================================

CREATE SEQUENCE sale_ref_seq;
CREATE TABLE Sales(
   id_sale UUID DEFAULT uuid_generate_v4(),
   ref VARCHAR(20) NOT NULL DEFAULT 'VTE' || to_char(nextval('sale_ref_seq'), 'fm0000'),
   sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
   total_amount NUMERIC(15,2),
   balance_due NUMERIC(15,2),
   table_number INTEGER ,
   charge_to_room BOOLEAN,
   id_room UUID,
   id_saler UUID NOT NULL,
   PRIMARY KEY(id_sale),
   UNIQUE(ref),
   FOREIGN KEY(id_room) REFERENCES Room(id_room),
   FOREIGN KEY(id_saler) REFERENCES Employees(id_employee)
--    CONSTRAINT chk_sales_location CHECK (
--       (table_number IS NOT NULL AND id_room IS NULL) OR
--       (table_number IS NULL AND id_room IS NOT NULL)
--    )
);

CREATE TABLE Sale_items(
   id_sale_item UUID DEFAULT uuid_generate_v4(),
   id_menu UUID NOT NULL,
   id_sale UUID NOT NULL,
   quantity INTEGER,
   unit_price NUMERIC(15,2) NOT NULL,
   total_amount NUMERIC(15,2),
   PRIMARY KEY(id_sale_item),
   FOREIGN KEY(id_menu) REFERENCES Menu_Items(id_menu),
   FOREIGN KEY(id_sale) REFERENCES Sales(id_sale)
);

CREATE SEQUENCE sales_payment_ref_seq;
CREATE TABLE Sales_payment(
   id_sale_payment UUID DEFAULT uuid_generate_v4(),
   ref VARCHAR(20) NOT NULL DEFAULT 'REG_VTE' || to_char(nextval('sales_payment_ref_seq'), 'fm0000'),
   id_sale UUID NOT NULL,
   payment_date DATE NOT NULL,
   amount NUMERIC(15,2) NOT NULL,
   id_payment_method UUID NOT NULL,
   PRIMARY KEY(id_sale_payment),
   UNIQUE(ref),
   FOREIGN KEY(id_payment_method) REFERENCES Payment_method(id_payment_method),
   FOREIGN KEY(id_sale) REFERENCES Sales(id_sale)
);

CREATE TABLE product_price(
   id_product_price UUID DEFAULT uuid_generate_v4(),
   id_menu UUID NOT NULL,
   special_price NUMERIC(15,2),
   id_room_type UUID,
   id_event UUID,
   PRIMARY KEY(id_product_price),
   FOREIGN KEY(id_menu) REFERENCES Menu_Items(id_menu),
   FOREIGN KEY(id_room_type) REFERENCES Room_type(id_room_type),
   FOREIGN KEY(id_event) REFERENCES Event(id_event)
);

-- =========================================================================
-- DROITS ET RELATIONS N-N (Pas de séquences de ref nécessaires)
-- =========================================================================

CREATE TABLE User_permission(
   id_user_permission UUID DEFAULT uuid_generate_v4(),
   id_user UUID NOT NULL,
   id_permission UUID NOT NULL,
   is_allowed BOOLEAN NOT NULL,
   PRIMARY KEY(id_user_permission),
   FOREIGN KEY(id_user) REFERENCES Users(id_user),
   FOREIGN KEY(id_permission) REFERENCES Permission(id_permission)
);

CREATE TABLE User_role(
   id_user_role UUID DEFAULT uuid_generate_v4(),
   id_user UUID NOT NULL,
   id_role UUID NOT NULL,
   PRIMARY KEY(id_user_role),
   FOREIGN KEY(id_user) REFERENCES Users(id_user),
   FOREIGN KEY(id_role) REFERENCES role(id_role)
);

CREATE TABLE Role_permission(
   id_role_permission UUID DEFAULT uuid_generate_v4(),
   id_role UUID NOT NULL,
   id_permission UUID NOT NULL,
   is_granted BOOLEAN,
   PRIMARY KEY(id_role_permission),
   FOREIGN KEY(id_role) REFERENCES role(id_role),
   FOREIGN KEY(id_permission) REFERENCES Permission(id_permission)
);
-- for the unique use keys when we want to chnage the password for example
CREATE TABLE User_tokens(
   id_token UUID DEFAULT uuid_generate_v4() ,
   token UUID DEFAULT uuid_generate_v4() NOT NULL ,
   token_type VARCHAR(30) ,
   expires_at TIMESTAMPTZ NOT NULL,
   used BOOLEAN,
   created_at TIMESTAMPTZ,
   id_user UUID NOT NULL,
   PRIMARY KEY(id_token),
   UNIQUE(token),
   FOREIGN KEY(id_user) REFERENCES Users(id_user)
);
