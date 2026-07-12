const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize, Category, Product, Drug, Customer, Prescription, User } = require('../models');

const seedPharmacy = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB. Seeding Pharmacy data...');

    // 1. Create a Construction Category
    const pharmacyCat = await Category.create({
      name: 'Site Equipment / Machinery',
      storeType: 'department',
      description: 'Heavy machinery and site tools'
    });

    // 2. Create Products
    const products = await Product.bulkCreate([
      { name: 'Concrete Mixer (Portable)', sku: 'CON-MIX-01', price: 1500.00, costPrice: 1200.00, stock: 5, categoryId: pharmacyCat.id, storeType: 'department' },
      { name: 'Scaffolding Set (Standard)', sku: 'CON-SCAF-02', price: 350.00, costPrice: 250.00, stock: 50, categoryId: pharmacyCat.id, storeType: 'department' },
      { name: 'Industrial Drill (Corded)', sku: 'CON-DRL-03', price: 120.00, costPrice: 85.00, stock: 25, categoryId: pharmacyCat.id, storeType: 'department' },
      { name: 'Wheelbarrow (Heavy Duty)', sku: 'CON-WHL-04', price: 80.00, costPrice: 50.00, stock: 100, categoryId: pharmacyCat.id, storeType: 'department' },
      { name: 'Laser Level (Self-leveling)', sku: 'CON-LSR-05', price: 250.00, costPrice: 180.00, stock: 15, categoryId: pharmacyCat.id, storeType: 'department' },
      { name: 'Safety Harness (Full Body)', sku: 'CON-HRN-06', price: 75.00, costPrice: 45.00, stock: 200, categoryId: pharmacyCat.id, storeType: 'department' }
    ]);

    // 3. Create Drugs mapping to Products (Reusing Drug table for warranty/certification info as an example, since structure cannot change)
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setDate(today.getDate() + 15); // Expiring soon

    const nextYear = new Date(today);
    nextYear.setFullYear(today.getFullYear() + 1);

    await Drug.bulkCreate([
      { productId: products[0].id, genericName: 'Mixer', brandName: 'BuildMix', schedule: 'Heavy', batchNo: 'BATCH-MIX-001', manufacturer: 'Cat', expiryDate: nextYear, isControlledSubstance: false },
      { productId: products[1].id, genericName: 'Scaffolding', brandName: 'SafeScaff', schedule: 'Standard', batchNo: 'BATCH-SCAF-002', manufacturer: 'BuildCo', expiryDate: nextMonth, isControlledSubstance: false },
      { productId: products[2].id, genericName: 'Drill', brandName: 'PowerDrill', schedule: 'Standard', batchNo: 'BATCH-DRL-003', manufacturer: 'DeWalt', expiryDate: nextYear, isControlledSubstance: false },
      { productId: products[3].id, genericName: 'Wheelbarrow', brandName: 'CarryAll', schedule: 'Standard', batchNo: 'BATCH-WHL-004', manufacturer: 'Truper', expiryDate: nextYear, isControlledSubstance: false },
      { productId: products[4].id, genericName: 'Level', brandName: 'LaserPro', schedule: 'Standard', batchNo: 'BATCH-LSR-005', manufacturer: 'Bosch', expiryDate: nextMonth, isControlledSubstance: false },
      { productId: products[5].id, genericName: 'Harness', brandName: 'SafeFall', schedule: 'Standard', batchNo: 'BATCH-HRN-006', manufacturer: '3M', expiryDate: nextYear, isControlledSubstance: false }
    ]);

    // 4. Create Customers if needed
    const customer = await Customer.create({
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '1234567890',
      address: '123 Main St'
    });

    // 5. Create a Pending Prescription
    // Note: Items association is not explicitly imported, we'll assume there is a PrescriptionItem model or we just create Prescription for now.
    // Let's import PrescriptionItem dynamically if needed, or we just leave Prescription empty of items to at least show in the portal.
    const { PrescriptionItem } = require('../models');
    if (PrescriptionItem) {
        const rx = await Prescription.create({
        customerId: customer.id,
        doctorName: 'Dr. Smith',
        status: 'pending'
        });

        await PrescriptionItem.create({
        prescriptionId: rx.id,
        drugId: (await Drug.findOne({ where: { brandName: 'SafeScaff' } })).id,
        quantity: 2,
        dosageInstruction: 'Take 1 pill twice a day'
        });
    }

    console.log('Pharmacy Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seedPharmacy();
