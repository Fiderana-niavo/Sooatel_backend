import AppDataSource from '../data-source';
import { Item } from '../Entities/Item';
import { MenuItem } from '../Entities/MenuItem';
import { Sale } from '../Entities/Sale';
import { SaleItem } from '../Entities/SaleItem';
import { Invoice } from '../Entities/Invoice';
import { Payment } from '../Entities/Payment';
import { MenuCategory } from '../Entities/MenuCategory';
import { ItemType } from '../Entities/ItemType';
import { User } from '../Entities/User';
import { UnitOfMeasure } from '../Entities/UnitOfMeasure';
import { PaymentMethod } from '../Entities/PaymentMethod';
import { Employee } from '../Entities/Employee';

async function seed() {
  await AppDataSource.initialize();
  console.log('DB Connected');

  const user = await AppDataSource.manager.findOne(User, { where: { username: 'fiderana' } });
  const idUser = user ? user.idUser : null;

  let cat = await AppDataSource.manager.findOne(MenuCategory, { where: { label: 'Plats' } });
  if (!cat) {
    cat = new MenuCategory();
    cat.label = 'Plats';
    cat = await AppDataSource.manager.save(cat);
  }

  let type = await AppDataSource.manager.findOne(ItemType, { where: { label: 'Consommable' } });
  if (!type) {
    type = new ItemType();
    type.label = 'Consommable';
    type = await AppDataSource.manager.save(type);
  }

  let unit = await AppDataSource.manager.findOne(UnitOfMeasure, { where: { label: 'Unité' } });
  if (!unit) {
    unit = new UnitOfMeasure();
    unit.label = 'Unité';
    unit.symbol = 'U';
    unit = await AppDataSource.manager.save(unit);
  }


  let pm = await AppDataSource.manager.findOne(PaymentMethod, { where: { label: 'Espèces' } });
  if (!pm) {
    pm = new PaymentMethod();
    pm.label = 'Espèces';
    pm = await AppDataSource.manager.save(pm);
  }

  const employee = await AppDataSource.manager.findOne(Employee, { where: {} });
  if (!employee) throw new Error('No employee found in DB to attach to sales');
  const idSaler = employee.idEmployee;

  const productsData = [
    { name: 'Pizza Margherita', price: 25000, cost: 8000 },
    { name: 'Burger Maison', price: 18000, cost: 6000 },
    { name: 'Salade César', price: 15000, cost: 5000 },
    { name: 'Coca-Cola', price: 5000, cost: 2000 },
    { name: 'Eau Minérale', price: 3000, cost: 1000 },
    { name: 'Steak Frites', price: 35000, cost: 12000 },
    { name: 'Tiramisu', price: 12000, cost: 4000 }
  ];

  const menuItems = [];

  for (const p of productsData) {
    let item = await AppDataSource.manager.findOne(Item, { where: { label: p.name } });
    if (!item) {
      item = new Item();
      item.label = p.name;
      item.ref = 'ITM-' + p.name.replace(/ /g, '').toUpperCase();
      item.idProductType = type.idProductType;
      item.idUnit = unit.idUnit;
      item.minimumStockLevel = 0;
      item.isPerishable = false;
      item.status = 1;
      item.isProduced = false;
      item.quantity = 100;
      item = await AppDataSource.manager.save(item);
    }

    let mi = await AppDataSource.manager.findOne(MenuItem, { where: { idItem: item.idItem } });
    if (!mi) {
      mi = new MenuItem();
      mi.idItem = item.idItem;
      mi.salePrice = p.price;
      mi.unitCost = p.cost;
      mi.idCategory = cat.idCategory;
      mi = await AppDataSource.manager.save(mi);
    } else {
      mi.unitCost = p.cost;
      mi = await AppDataSource.manager.save(mi);
    }
    menuItems.push(mi);
  }

  const now = new Date();

  // Generate sales for the last 4 months (including current month)
  for (let m = 0; m < 4; m++) {
    const targetMonth = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() - m + 1, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const currentDay = new Date(now.getFullYear(), now.getMonth() - m, d);
      
      if (currentDay > now) continue;

      const numSales = Math.floor(Math.random() * 5) + 1; // 1 to 5 sales per day
      
      for (let s = 0; s < numSales; s++) {
        const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
        const invoice = new Invoice();
        invoice.totalAmount = 0;
        invoice.balanceDue = 0;
        invoice.status = 0; // Closed
        invoice.invoiceDate = currentDay;
        invoice.invoiceNumberSystem = 'INV-' + rand + '-' + s;
        invoice.createdBy = idUser;
        await AppDataSource.manager.save(Invoice, invoice);

        const sale = new Sale();
        sale.saleDate = currentDay;
        sale.status = 0; // Closed
        sale.createdBy = idUser;
        sale.idSaler = idSaler;
        sale.ref = 'SL-' + rand + '-' + s;
        sale.idInvoice = invoice.idInvoice;
        await AppDataSource.manager.save(Sale, sale);

        let total = 0;
        const numItems = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < numItems; i++) {
          const mi = menuItems[Math.floor(Math.random() * menuItems.length)];
          const qty = Math.floor(Math.random() * 3) + 1; // 1 to 3 items
          
          if (!mi) continue;

          const si = new SaleItem();
          si.idSale = sale.idSale;
          si.idMenu = mi.idMenu;
          si.quantity = qty;
          si.unitPrice = mi.salePrice;
          si.totalAmount = qty * mi.salePrice;
          await AppDataSource.manager.save(SaleItem, si);
          
          total += si.totalAmount;
        }

        invoice.totalAmount = total;
        invoice.balanceDue = 0;
        await AppDataSource.manager.save(Invoice, invoice);

        sale.totalAmount = total;
        await AppDataSource.manager.save(Sale, sale);

        const payment = new Payment();
        payment.idInvoice = invoice.idInvoice;
        payment.amount = total;
        payment.paymentDate = currentDay;
        payment.idPaymentMethod = pm.idPaymentMethod;
        payment.ref = 'PAY-' + rand + '-' + s;
        await AppDataSource.manager.save(Payment, payment);
      }
    }
  }

  console.log('Seeding finished!');
  process.exit(0);
}

seed().catch(console.error);
