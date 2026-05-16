const { sequelize, User, Category, Product, Customer, Sale, Employee, Department, Designation } = require('../models');
const bcrypt = require('bcryptjs');

const seed = async () => {
  try {
    await sequelize.sync({ force: true }); // Reset DB
    console.log('Database synced. Seeding...');

    // 1. Create Users for all roles
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);

    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@erp.com',
      phone: '0000000000',
      passwordHash,
      role: 'admin'
    });

    await User.create({
      name: 'Store Manager',
      email: 'manager@erp.com',
      phone: '1111111111',
      passwordHash,
      role: 'manager'
    });

    await User.create({
      name: 'Sales Manager',
      email: 'sales@erp.com',
      phone: '5555555555',
      passwordHash,
      role: 'sales'
    });

    await User.create({
      name: 'Cashier One',
      email: 'cashier@erp.com',
      phone: '4444444444',
      passwordHash,
      role: 'cashier'
    });

    await User.create({
      name: 'Inventory Lead',
      email: 'inventory@erp.com',
      phone: '2222222222',
      passwordHash,
      role: 'inventory'
    });

    await User.create({
      name: 'HR Head',
      email: 'hr@erp.com',
      phone: '3333333333',
      passwordHash,
      role: 'hr'
    });

    // 2. Create Categories
    const catFood = await Category.create({ name: 'Food & Beverage', storeType: 'department', description: 'Edible products' });
    const catElec = await Category.create({ name: 'Electronics', storeType: 'department', description: 'Tech gadgets' });
    const catMed = await Category.create({ name: 'Medicine', storeType: 'pharmacy', description: 'Prescription drugs' });
    const catSkin = await Category.create({ name: 'Skincare', storeType: 'pharmacy', description: 'Health & Beauty' });

    // 3. Create Departments (Day 6)
    const depts = [
      { name: 'Engineering', description: 'Technical and Software' },
      { name: 'Sales', description: 'Sales and Marketing' },
      { name: 'HR', description: 'Human Resources' },
      { name: 'Finance', description: 'Accounts and Finance' },
      { name: 'Operations', description: 'Fleet and Logistics' },
    ];
    const createdDepts = await Department.bulkCreate(depts);

    // 4. Create Designations (Day 6)
    const desigs = [
      { name: 'Software Engineer', level: 'mid' },
      { name: 'Sales Executive', level: 'mid' },
      { name: 'HR Manager', level: 'manager' },
      { name: 'Accountant', level: 'mid' },
      { name: 'Operations Lead', level: 'lead' },
    ];
    const createdDesigs = await Designation.bulkCreate(desigs);

    // 5. Create Products
    const deptProducts = [
      { name: 'Organic Coffee Beans', sku: 'DEPT-001', price: 25.00, costPrice: 15.00, stock: 100, categoryId: catFood.id, storeType: 'department' },
      { name: 'Ergonomic Mouse', sku: 'DEPT-002', price: 45.00, costPrice: 20.00, stock: 50, categoryId: catElec.id, storeType: 'department' },
      { name: 'Wireless Keyboard', sku: 'DEPT-003', price: 65.00, costPrice: 30.00, stock: 5, categoryId: catElec.id, storeType: 'department' },
      { name: 'Dark Chocolate', sku: 'DEPT-004', price: 12.00, costPrice: 6.00, stock: 200, categoryId: catFood.id, storeType: 'department' },
      { name: 'Green Tea Pack', sku: 'DEPT-005', price: 18.00, costPrice: 10.00, stock: 8, categoryId: catFood.id, storeType: 'department' },
      { name: 'USB-C Hub', sku: 'DEPT-006', price: 35.00, costPrice: 18.00, stock: 25, categoryId: catElec.id, storeType: 'department' },
      { name: 'Smart LED Bulb', sku: 'DEPT-007', price: 22.00, costPrice: 12.00, stock: 40, categoryId: catElec.id, storeType: 'department' },
      { name: 'Whole Wheat Bread', sku: 'DEPT-008', price: 4.50, costPrice: 2.00, stock: 60, categoryId: catFood.id, storeType: 'department' },
      { name: 'Almond Milk', sku: 'DEPT-009', price: 7.00, costPrice: 3.50, stock: 3, categoryId: catFood.id, storeType: 'department' },
      { name: 'Noise Cancelling Headphones', sku: 'DEPT-010', price: 199.00, costPrice: 120.00, stock: 15, categoryId: catElec.id, storeType: 'department' },
    ];

    const pharmaProducts = [
      { name: 'Paracetamol 500mg', sku: 'PHAR-001', price: 5.00, costPrice: 1.50, stock: 500, categoryId: catMed.id, storeType: 'pharmacy', expiryDate: '2027-12-01' },
      { name: 'Amoxicillin 250mg', sku: 'PHAR-002', price: 15.00, costPrice: 4.00, stock: 200, categoryId: catMed.id, storeType: 'pharmacy', expiryDate: '2026-06-15' },
      { name: 'Face Moisturizer', sku: 'PHAR-003', price: 28.00, costPrice: 12.00, stock: 45, categoryId: catSkin.id, storeType: 'pharmacy', expiryDate: '2028-01-20' },
      { name: 'Sunscreen SPF 50', sku: 'PHAR-004', price: 32.00, costPrice: 15.00, stock: 6, categoryId: catSkin.id, storeType: 'pharmacy', expiryDate: '2026-08-10' },
      { name: 'Ibuprofen 200mg', sku: 'PHAR-005', price: 8.00, costPrice: 2.00, stock: 300, categoryId: catMed.id, storeType: 'pharmacy', expiryDate: '2027-03-05' },
      { name: 'Vitamin C 1000mg', sku: 'PHAR-006', price: 22.00, costPrice: 8.00, stock: 150, categoryId: catMed.id, storeType: 'pharmacy', expiryDate: '2028-05-12' },
      { name: 'Antiseptic Cream', sku: 'PHAR-007', price: 12.00, costPrice: 4.50, stock: 80, categoryId: catMed.id, storeType: 'pharmacy', expiryDate: '2027-09-30' },
      { name: 'Aloe Vera Gel', sku: 'PHAR-008', price: 14.00, costPrice: 6.00, stock: 2, categoryId: catSkin.id, storeType: 'pharmacy', expiryDate: '2026-11-22' },
      { name: 'Hand Sanitizer', sku: 'PHAR-009', price: 6.00, costPrice: 2.00, stock: 400, categoryId: catSkin.id, storeType: 'pharmacy', expiryDate: '2028-12-31' },
      { name: 'Cough Syrup', sku: 'PHAR-010', price: 10.00, costPrice: 3.50, stock: 90, categoryId: catMed.id, storeType: 'pharmacy', expiryDate: '2026-04-18' },
    ];

    await Product.bulkCreate([...deptProducts, ...pharmaProducts]);

    // 6. Create Customers
    const customer = await Customer.create({
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '555-0199',
      address: '123 Business St'
    });

    // 7. Create Employees
    await Employee.create({
      empCode: 'EMP-0001',
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@erp.com',
      position: 'Sales Manager',
      salary: 5500.00,
      joiningDate: '2023-01-15',
      departmentId: createdDepts[1].id,
      designationId: createdDesigs[2].id,
    });

    console.log('Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();
