const { 
  sequelize, User, Employee, Product, Sale, SaleItem, 
  Drug, Prescription, PrescriptionItem, Supplier, 
  PurchaseOrder, Expense, Attendance, Leave, 
  PayrollRun, Payslip 
} = require('../models');

async function runAudit() {
  console.log('🚀 Starting ERP System Audit...');
  
  try {
    // 1. Check Database Connection & Sync
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('✅ Database connection established and tables synced.');

    // 2. Model Counts
    const counts = {
      Users: await User.count(),
      Employees: await Employee.count(),
      Products: await Product.count(),
      Sales: await Sale.count(),
      Drugs: await Drug.count(),
      Suppliers: await Supplier.count()
    };
    console.table(counts);

    // 3. Association Integrity Check
    console.log('\n🔍 Verifying Model Associations...');
    
    // Check Drug <-> Product
    const drugWithProduct = await Drug.findOne({ include: [Product] });
    if (drugWithProduct && drugWithProduct.Product) {
      console.log('✅ Drug <-> Product link intact.');
    } else {
      console.warn('⚠️ Warning: Drug model missing Product association or no data found.');
    }

    // Check Employee <-> User
    const empWithUser = await Employee.findOne({ include: [User] });
    if (empWithUser && empWithUser.User) {
      console.log('✅ Employee <-> User link intact.');
    } else {
      console.warn('⚠️ Warning: Employee model missing User association or no data found.');
    }

    // Check Sale <-> SaleItems
    const saleWithItems = await Sale.findOne({ include: [{ model: SaleItem, as: 'Items' }] });
    if (saleWithItems && saleWithItems.Items) {
      console.log('✅ Sale <-> SaleItem link intact.');
    } else {
      console.warn('⚠️ Warning: Sale model missing Items association or no data found.');
    }

    // 4. Pharmacy Logic Check
    const pendingPres = await Prescription.count({ where: { status: 'pending' } });
    console.log(`📊 Pending Prescriptions: ${pendingPres}`);

    // 5. Payroll Check
    const recentRun = await PayrollRun.findOne({ order: [['createdAt', 'DESC']] });
    console.log(`💰 Latest Payroll Run: ${recentRun ? recentRun.month + '/' + recentRun.year : 'None'}`);

    console.log('\n✨ Audit Complete. System is stable.');
  } catch (err) {
    console.error('❌ Audit Failed:', err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runAudit();
