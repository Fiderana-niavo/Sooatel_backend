const fs = require('fs');
const path = require('path');

const sqlPath = path.join(__dirname, 'Scripts', 'Sooatel.sql');
const entitiesDir = path.join(__dirname, 'Entities');

if (!fs.existsSync(entitiesDir)) {
  fs.mkdirSync(entitiesDir, { recursive: true });
}

const sqlContent = fs.readFileSync(sqlPath, 'utf8');

// Mapping table names to singular PascalCase ClassNames
const tableNameToClassName = {
  'job_titles': 'JobTitle',
  'role': 'Role',
  'permission': 'Permission',
  'item_type': 'ItemType',
  'unit_of_measure': 'UnitOfMeasure',
  'payment_method': 'PaymentMethod',
  'room_type': 'RoomType',
  'leave_types': 'LeaveType',
  'shift_type': 'ShiftType',
  'team': 'Team',
  'menu_categories': 'MenuCategory',
  'supplier': 'Supplier',
  'employees': 'Employee',
  'users': 'User',
  'supplier_products': 'SupplierProduct',
  'supplier_products_price': 'SupplierProductPrice',
  'items': 'Item',
  'supplied_items': 'SuppliedItem',
  'item_unit': 'ItemUnit',
  'purchases': 'Purchase',
  'purchase_details': 'PurchaseDetail',
  'purchase_payment': 'PurchasePayment',
  'stock_movement': 'StockMovement',
  'cash_journal': 'CashJournal',
  'cash_outflows': 'CashOutflow',
  'employment_type': 'EmploymentType',
  'employee_team': 'EmployeeTeam',
  'schedules': 'Schedule',
  'employee_requirements': 'EmployeeRequirement',
  'attendances': 'Attendance',
  'leaves': 'Leave',
  'leave_transactions': 'LeaveTransaction',
  'employee_leave_balances': 'EmployeeLeaveBalance',
  'employees_job': 'EmployeeJob',
  'employee_availabilities': 'EmployeeAvailability',
  'event': 'Event',
  'recipes': 'Recipe',
  'dish_production': 'DishProduction',
  'room': 'Room',
  'menu_items': 'MenuItem',
  'sales': 'Sale',
  'sale_items': 'SaleItem',
  'sales_payment': 'SalesPayment',
  'product_price': 'ProductPrice',
  'user_permission': 'UserPermission',
  'user_role': 'UserRole',
  'role_permission': 'RolePermission',
  'permission_category': 'PermissionCategory',
  'user_tokens': 'UserToken',
  'internship': 'Internship'
};

// Clean SQL comments and format
function cleanSql(sql) {
  return sql
    .split('\n')
    .map(line => {
      const idx = line.indexOf('--');
      if (idx !== -1) {
        return line.substring(0, idx);
      }
      return line;
    })
    .join('\n');
}

const cleanedSql = cleanSql(sqlContent);

// Regex to capture CREATE TABLE blocks
// Standard CREATE TABLE tableName ( ... );
const createTableRegex = /CREATE\s+TABLE\s+(\w+)\s*\(([\s\S]*?)\);/gi;

let match;
const tables = [];

while ((match = createTableRegex.exec(cleanedSql)) !== null) {
  const tableNameRaw = match[1];
  const body = match[2];
  
  tables.push({
    nameRaw: tableNameRaw,
    nameLower: tableNameRaw.toLowerCase(),
    body: body
  });
}

console.log(`Parsed ${tables.length} tables from SQL.`);

tables.forEach(table => {
  const className = tableNameToClassName[table.nameLower];
  if (!className) {
    console.warn(`Warning: No ClassName mapping for table: ${table.nameRaw}`);
    return;
  }

  // Parse lines in body
  // We can split by commas, but commas can also be within numeric(15,2) or check constraints.
  // A better way is parsing line-by-line since each definition in the DDL is on its own line.
  const lines = table.body.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('--'));

  const columns = [];
  const primaryKeys = new Set();
  const uniques = new Set();
  const foreignKeys = [];

  lines.forEach(line => {
    // Check if line specifies primary key, e.g. PRIMARY KEY(id_job_title)
    if (/^PRIMARY\s+KEY\s*\(([^)]+)\)/i.test(line)) {
      const pkMatch = line.match(/^PRIMARY\s+KEY\s*\(([^)]+)\)/i);
      pkMatch[1].split(',').map(k => k.trim().toLowerCase()).forEach(k => primaryKeys.add(k));
      return;
    }

    // Check if line specifies unique, e.g. UNIQUE(label) or UNIQUE(id_team, id_employee)
    if (/^UNIQUE\s*\(([^)]+)\)/i.test(line)) {
      const uMatch = line.match(/^UNIQUE\s*\(([^)]+)\)/i);
      uMatch[1].split(',').map(k => k.trim().toLowerCase()).forEach(k => uniques.add(k));
      return;
    }

    // Check if line is a foreign key definition
    // FOREIGN KEY(id_employee) REFERENCES Employees(id_employee)
    if (/^FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+(\w+)\s*\(([^)]+)\)/i.test(line)) {
      const fkMatch = line.match(/^FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+(\w+)\s*\(([^)]+)\)/i);
      const fkCol = fkMatch[1].trim().toLowerCase();
      const refTable = fkMatch[2].trim().toLowerCase();
      const refCol = fkMatch[3].trim().toLowerCase();
      foreignKeys.push({
        column: fkCol,
        referencedTable: refTable,
        referencedColumn: refCol
      });
      return;
    }

    // Check constraints are ignored for typeorm column generation, but we should not treat them as columns
    if (/^CONSTRAINT\s+/i.test(line) || /^CHECK\s+/i.test(line)) {
      return;
    }

    // Parse column line
    // e.g. id_job_title UUID DEFAULT uuid_generate_v4(),
    // e.g. title VARCHAR(100) ,
    // e.g. requires_proof BOOLEAN,
    // Strip trailing comma
    let colLine = line;
    if (colLine.endsWith(',')) {
      colLine = colLine.slice(0, -1).trim();
    }

    // Match column name and type
    const colMatch = colLine.match(/^(\w+)\s+([\w()]+)/i);
    if (!colMatch) {
      return;
    }

    const colName = colMatch[1];
    const colTypeRaw = colMatch[2].toLowerCase();
    
    // Check constraints in same line (like NOT NULL, UNIQUE, DEFAULT, etc.)
    const isNotNull = /\bNOT\s+NULL\b/i.test(colLine);
    const isUnique = /\bUNIQUE\b/i.test(colLine);
    
    columns.push({
      name: colName,
      nameLower: colName.toLowerCase(),
      typeRaw: colTypeRaw,
      isNotNull: isNotNull,
      isUnique: isUnique,
      line: colLine
    });
  });

  // Second pass: associate primary keys and unique keys
  columns.forEach(col => {
    if (primaryKeys.has(col.nameLower)) {
      col.isPrimary = true;
    }
    if (uniques.has(col.nameLower)) {
      col.isUnique = true;
    }
  });

  // Third pass: find relation targets
  const imports = new Set();
  imports.add('BaseEntity');
  imports.add('Entity');
  imports.add('Column');

  const relationFields = [];

  foreignKeys.forEach(fk => {
    const col = columns.find(c => c.nameLower === fk.column);
    if (col) {
      col.isForeignKey = true;
    }
    const refClass = tableNameToClassName[fk.referencedTable];
    if (refClass) {
      // Find camelCase relation name
      // E.g. id_employee -> employee
      // E.g. id_product_type -> productType
      // E.g. id_unit -> unit
      // E.g. id_processed_by -> processedBy
      let relName = fk.column;
      if (relName.startsWith('id_')) {
        relName = relName.substring(3);
      }
      relName = toCamelCase(relName);

      relationFields.push({
        propertyName: relName,
        referencedClass: refClass,
        foreignKeyColumn: fk.column
      });
      imports.add('ManyToOne');
      imports.add('JoinColumn');
    }
  });

  // Format columns
  const fields = [];
  columns.forEach(col => {
    let propName = toCamelCase(col.name);
    // Resolve name conflict with relationship properties
    const hasConflict = relationFields.some(rel => rel.propertyName === propName);
    if (hasConflict) {
      propName = propName + 'Id';
    }

    let tsType = 'string';
    let dbType = col.typeRaw;
    let typeORMType = col.typeRaw;

    if (col.typeRaw.startsWith('varchar')) {
      tsType = 'string';
      typeORMType = 'varchar';
    } else if (col.typeRaw.startsWith('numeric')) {
      tsType = 'number';
      typeORMType = 'numeric';
    } else if (col.typeRaw === 'integer' || col.typeRaw === 'smallint') {
      tsType = 'number';
      typeORMType = col.typeRaw;
    } else if (col.typeRaw === 'boolean') {
      tsType = 'boolean';
      typeORMType = 'boolean';
    } else if (col.typeRaw === 'date' || col.typeRaw === 'timestamptz' || col.typeRaw === 'timestampz') {
      tsType = 'Date';
      typeORMType = col.typeRaw === 'timestampz' ? 'timestamptz' : col.typeRaw;
    } else if (col.typeRaw === 'time') {
      tsType = 'string';
      typeORMType = 'time';
    } else if (col.typeRaw === 'uuid') {
      tsType = 'string';
      typeORMType = 'uuid';
    }

    const columnOptions = [];
    columnOptions.push(`type: "${typeORMType}"`);
    
    // Check if varchar has length
    const lenMatch = col.line.match(/varchar\((\d+)\)/i);
    if (lenMatch) {
      columnOptions.push(`length: ${lenMatch[1]}`);
    }

    // Check if numeric has precision/scale
    const numMatch = col.line.match(/numeric\((\d+),\s*(\d+)\)/i);
    if (numMatch) {
      columnOptions.push(`precision: ${numMatch[1]}`);
      columnOptions.push(`scale: ${numMatch[2]}`);
    }

    if (!col.isNotNull && !col.isPrimary) {
      columnOptions.push('nullable: true');
    }

    if (col.isUnique) {
      columnOptions.push('unique: true');
    }

    columnOptions.push(`name: "${col.name}"`);

    let decorator = '';
    if (col.isPrimary) {
      imports.add('PrimaryGeneratedColumn');
      decorator = `@PrimaryGeneratedColumn("uuid", { name: "${col.name}" })`;
    } else {
      decorator = `@Column({ ${columnOptions.join(', ')} })`;
    }

    fields.push({
      name: propName,
      type: tsType,
      decorator: decorator
    });
  });

  // Build imports
  const importLines = [];
  importLines.push(`import { ${Array.from(imports).sort().join(', ')} } from "typeorm";`);
  
  const refClasses = new Set();
  relationFields.forEach(rel => {
    if (rel.referencedClass !== className) {
      refClasses.add(rel.referencedClass);
    }
  });
  Array.from(refClasses).sort().forEach(refClass => {
    importLines.push(`import { ${refClass} } from "./${refClass}";`);
  });

  // Build entity class content
  const classContent = [];
  classContent.push(`@Entity("${table.nameLower}")`);
  classContent.push(`export class ${className} extends BaseEntity {`);

  fields.forEach(f => {
    classContent.push(`  ${f.decorator}`);
    classContent.push(`  ${f.name}: ${f.type};`);
    classContent.push(``);
  });

  relationFields.forEach(rel => {
    classContent.push(`  @ManyToOne(() => ${rel.referencedClass})`);
    classContent.push(`  @JoinColumn({ name: "${rel.foreignKeyColumn}" })`);
    classContent.push(`  ${rel.propertyName}: ${rel.referencedClass};`);
    classContent.push(``);
  });

  classContent.push(`}`);

  const fileContent = `${importLines.join('\n')}\n\n${classContent.join('\n')}\n`;
  const filePath = path.join(entitiesDir, `${className}.ts`);

  fs.writeFileSync(filePath, fileContent, 'utf8');
  console.log(`Generated ${className}.ts`);
});

function toCamelCase(str) {
  return str.replace(/_([a-z0-9])/g, (g) => g[1].toUpperCase());
}
