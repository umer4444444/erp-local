const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize, User, Category, Product, Customer, Sale, Employee, Department, Designation } = require('../models');
const bcrypt = require('bcryptjs');

const seed = async () => {
  try {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await sequelize.sync({ force: true }); // Reset DB
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Database synced. Seeding Construction ERP data...');

    // 1. Create Users for all roles
    const salt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash('admin123', salt);
    const defaultHash = await bcrypt.hash('staff123', salt);

    const admin = await User.create({
      name: 'Project Director',
      email: 'admin@lancerstech.com',
      phone: '0000000000',
      passwordHash: adminHash,
      role: 'admin'
    });

    await User.create({
      name: 'Site Manager',
      email: 'manager@lancerstech.com',
      phone: '1111111111',
      passwordHash: defaultHash,
      role: 'manager'
    });

    await User.create({
      name: 'Inventory Controller',
      email: 'inventory@lancerstech.com',
      phone: '2222222222',
      passwordHash: defaultHash,
      role: 'inventory'
    });

    await User.create({
      name: 'HR & Payroll Lead',
      email: 'hr@lancerstech.com',
      phone: '3333333333',
      passwordHash: defaultHash,
      role: 'hr'
    });

    // 2. Create Categories (Construction Focused)
    const catStructural = await Category.create({ name: 'Structural Materials', storeType: 'department', description: 'Cement, Steel, Bricks' });
    const catFinishing = await Category.create({ name: 'Finishing & Interior', storeType: 'department', description: 'Tiles, Paint, Flooring' });
    const catMEP = await Category.create({ name: 'MEP (Mechanical/Elec/Plumb)', storeType: 'department', description: 'Pipes, Wires, Fittings' });
    const catTools = await Category.create({ name: 'Tools & Safety', storeType: 'department', description: 'Power tools and PPE' });

    // 3. Create Departments
    const depts = [
      { name: 'Civil Engineering', description: 'Structural and Site works' },
      { name: 'Architecture & Design', description: 'Planning and Interior' },
      { name: 'Procurement', description: 'Sourcing and Supply Chain' },
      { name: 'HR & Admin', description: 'Staff and Labor Management' },
      { name: 'Finance', description: 'Accounts, Billing, and Bidding' },
    ];
    const createdDepts = await Department.bulkCreate(depts);

    // 4. Create Designations
    const desigs = [
      { name: 'Senior Civil Engineer', level: 'lead' },
      { name: 'Site Supervisor', level: 'mid' },
      { name: 'Procurement Officer', level: 'mid' },
      { name: 'Quantity Surveyor', level: 'mid' },
      { name: 'Safety Officer', level: 'mid' },
    ];
    const createdDesigs = await Designation.bulkCreate(desigs);

    // 5. Create Construction Products
    const products = [
      // Structural
      { name: 'OPC Cement (50kg)', sku: 'STR-CEM-01', price: 1200.00, costPrice: 950.00, stock: 500, categoryId: catStructural.id, storeType: 'department' },
      { name: 'Steel Rebar 12mm (Ton)', sku: 'STR-STL-12', price: 265000.00, costPrice: 240000.00, stock: 10, categoryId: catStructural.id, storeType: 'department' },
      { name: 'Red Clay Bricks (1000 pcs)', sku: 'STR-BRK-01', price: 18000.00, costPrice: 15000.00, stock: 50, categoryId: catStructural.id, storeType: 'department' },
      { name: 'Crush Stone (Manual)', sku: 'STR-CRS-01', price: 85.00, costPrice: 65.00, stock: 2000, categoryId: catStructural.id, storeType: 'department' },
      
      // MEP
      { name: 'PVC Pipe 4-inch (10ft)', sku: 'MEP-PVC-04', price: 2500.00, costPrice: 1800.00, stock: 100, categoryId: catMEP.id, storeType: 'department' },
      { name: 'Electrical Wire 3/29 (Coil)', sku: 'MEP-WRE-01', price: 8500.00, costPrice: 7200.00, stock: 30, categoryId: catMEP.id, storeType: 'department' },
      { name: 'Copper Pipe 1/2-inch', sku: 'MEP-COP-01', price: 1200.00, costPrice: 900.00, stock: 150, categoryId: catMEP.id, storeType: 'department' },

      // Finishing
      { name: 'Matte White Paint (20L)', sku: 'FIN-PNT-WH', price: 15500.00, costPrice: 12000.00, stock: 40, categoryId: catFinishing.id, storeType: 'department' },
      { name: 'Porcelain Tile 2x2 (Box)', sku: 'FIN-TILE-01', price: 4500.00, costPrice: 3800.00, stock: 200, categoryId: catFinishing.id, storeType: 'department' },
      
      // Tools & Safety
      { name: 'Jack Hammer 15kg', sku: 'TLS-HMR-15', price: 45000.00, costPrice: 35000.00, stock: 5, categoryId: catTools.id, storeType: 'department' },
      { name: 'Safety Helmet (Yellow)', sku: 'TLS-SAF-HLM', price: 850.00, costPrice: 450.00, stock: 100, categoryId: catTools.id, storeType: 'department' },
      { name: 'Reflective Safety Vest', sku: 'TLS-SAF-VST', price: 450.00, costPrice: 200.00, stock: 150, categoryId: catTools.id, storeType: 'department' },
    ];

    await Product.bulkCreate(products);

    // 6. Create Construction Clients (Customers)
    await Customer.bulkCreate([
      { name: 'Modern Builders Ltd', email: 'info@modernbuilders.com', phone: '021-3456789', address: 'DHA Phase 6, Karachi' },
      { name: 'Elite Residency Project', email: 'procurement@eliteresidency.com', phone: '042-9988776', address: 'Gulberg III, Lahore' }
    ]);

    // 7. Create Site Employees
    await Employee.create({
      empCode: 'EMP-1001',
      firstName: 'Asif',
      lastName: 'Khan',
      email: 'asif.eng@lancerstech.com',
      position: 'Senior Civil Engineer',
      salary: 150000.00,
      joiningDate: '2024-01-01',
      departmentId: createdDepts[0].id,
      designationId: createdDesigs[0].id,
      status: 'active'
    });

    await Employee.create({
      empCode: 'EMP-1002',
      firstName: 'Sarah',
      lastName: 'Ahmed',
      email: 'sarah.proc@lancerstech.com',
      position: 'Procurement Officer',
      salary: 85000.00,
      joiningDate: '2024-03-15',
      departmentId: createdDepts[2].id,
      designationId: createdDesigs[2].id,
      status: 'active'
    });

    console.log('Construction ERP Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();
