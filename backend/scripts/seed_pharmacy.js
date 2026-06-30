const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize, Category, Product, Drug, Customer, Prescription, User } = require('../models');

const seedPharmacy = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB. Seeding Pharmacy data...');

    // 1. Create a Pharmacy Category
    const pharmacyCat = await Category.create({
      name: 'Pharmacy / Medicines',
      storeType: 'department',
      description: 'Prescription and OTC drugs'
    });

    // 2. Create Products
    const products = await Product.bulkCreate([
      { name: 'Paracetamol 500mg', sku: 'PH-PAR-500', price: 50.00, costPrice: 30.00, stock: 1500, categoryId: pharmacyCat.id, storeType: 'department' },
      { name: 'Amoxicillin 250mg', sku: 'PH-AMX-250', price: 120.00, costPrice: 80.00, stock: 500, categoryId: pharmacyCat.id, storeType: 'department' },
      { name: 'Ibuprofen 400mg', sku: 'PH-IBU-400', price: 80.00, costPrice: 50.00, stock: 800, categoryId: pharmacyCat.id, storeType: 'department' },
      { name: 'Diazepam 5mg (Controlled)', sku: 'PH-DZP-05', price: 200.00, costPrice: 150.00, stock: 200, categoryId: pharmacyCat.id, storeType: 'department' },
      { name: 'Lisinopril 10mg', sku: 'PH-LIS-10', price: 150.00, costPrice: 90.00, stock: 300, categoryId: pharmacyCat.id, storeType: 'department' },
      { name: 'Metformin 500mg', sku: 'PH-MET-500', price: 60.00, costPrice: 40.00, stock: 1000, categoryId: pharmacyCat.id, storeType: 'department' }
    ]);

    // 3. Create Drugs mapping to Products
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setDate(today.getDate() + 15); // Expiring soon

    const nextYear = new Date(today);
    nextYear.setFullYear(today.getFullYear() + 1);

    await Drug.bulkCreate([
      { productId: products[0].id, genericName: 'Acetaminophen', brandName: 'Panadol', schedule: 'OTC', batchNo: 'BATCH-PAN-001', manufacturer: 'GSK', expiryDate: nextYear, isControlledSubstance: false },
      { productId: products[1].id, genericName: 'Amoxicillin', brandName: 'Amoxil', schedule: 'Schedule H', batchNo: 'BATCH-AMX-002', manufacturer: 'Pfizer', expiryDate: nextMonth, isControlledSubstance: false },
      { productId: products[2].id, genericName: 'Ibuprofen', brandName: 'Brufen', schedule: 'OTC', batchNo: 'BATCH-BRU-003', manufacturer: 'Abbott', expiryDate: nextYear, isControlledSubstance: false },
      { productId: products[3].id, genericName: 'Diazepam', brandName: 'Valium', schedule: 'Schedule X', batchNo: 'BATCH-VAL-004', manufacturer: 'Roche', expiryDate: nextYear, isControlledSubstance: true },
      { productId: products[4].id, genericName: 'Lisinopril', brandName: 'Prinivil', schedule: 'Schedule H', batchNo: 'BATCH-LIS-005', manufacturer: 'Merck', expiryDate: nextMonth, isControlledSubstance: false },
      { productId: products[5].id, genericName: 'Metformin', brandName: 'Glucophage', schedule: 'Schedule H', batchNo: 'BATCH-GLU-006', manufacturer: 'Merck', expiryDate: nextYear, isControlledSubstance: false }
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
        drugId: (await Drug.findOne({ where: { brandName: 'Amoxil' } })).id,
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
