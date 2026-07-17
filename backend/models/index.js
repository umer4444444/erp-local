const sequelize = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const ProductVariation = require('./ProductVariation');
const Customer = require('./Customer');
const Sale = require('./Sale');
const SaleItem = require('./SaleItem');
const Employee = require('./Employee');
const Expense = require('./Expense');
const SalesSession = require('./SalesSession');
const Ride = require('./Ride');
const Bid = require('./Bid');
const Rating = require('./Rating');
const StockLog = require('./StockLog');
const Department = require('./Department');
const Designation = require('./Designation');
const WorkShift = require('./WorkShift');
const Attendance = require('./Attendance');
const Leave = require('./Leave');
const LeaveBalance = require('./LeaveBalance');
const PayrollRun = require('./PayrollRun');
const Payslip = require('./Payslip');

const Supplier = require('./Supplier');
const PurchaseOrder = require('./PurchaseOrder');
const AuditLog = require('./AuditLog');
const LoyaltyTransaction = require('./LoyaltyTransaction');
const POItem = require('./POItem');
const SalaryAdvance = require('./SalaryAdvance');
const DocumentVault = require('./DocumentVault');

// Inventory Associations
Category.hasMany(Product, { foreignKey: 'categoryId' });
Product.belongsTo(Category, { foreignKey: 'categoryId' });

Product.hasMany(StockLog, { foreignKey: 'productId' });
StockLog.belongsTo(Product, { foreignKey: 'productId' });

Product.hasMany(ProductVariation, { as: 'Variations', foreignKey: 'productId' });
ProductVariation.belongsTo(Product, { foreignKey: 'productId' });

User.hasMany(StockLog, { foreignKey: 'userId', onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
StockLog.belongsTo(User, { foreignKey: 'userId' });

// Sales Associations
Customer.hasMany(Sale, { foreignKey: 'customerId', onDelete: 'RESTRICT' });
Sale.belongsTo(Customer, { foreignKey: 'customerId' });



Sale.hasMany(SaleItem, { as: 'Items', foreignKey: 'saleId' });
SaleItem.belongsTo(Sale, { foreignKey: 'saleId' });

Product.hasMany(SaleItem, { foreignKey: 'productId', onDelete: 'RESTRICT' });
SaleItem.belongsTo(Product, { foreignKey: 'productId' });

// User/SalesSession Associations
User.hasMany(SalesSession, { foreignKey: 'userId' });
SalesSession.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Sale, { foreignKey: 'userId', constraints: false });
Sale.belongsTo(User, { foreignKey: 'userId', constraints: false });



// Ride & Bid Associations
User.hasMany(Ride, { as: 'RiderRides', foreignKey: 'riderId' });
User.hasMany(Ride, { as: 'DriverRides', foreignKey: 'driverId' });
Ride.belongsTo(User, { as: 'Rider', foreignKey: 'riderId' });
Ride.belongsTo(User, { as: 'Driver', foreignKey: 'driverId' });

Ride.hasMany(Bid, { foreignKey: 'rideId' });
Bid.belongsTo(Ride, { foreignKey: 'rideId' });
User.hasMany(Bid, { foreignKey: 'driverId' });
Bid.belongsTo(User, { foreignKey: 'driverId' });

// Employee Associations (Day 6)
Department.hasMany(Employee, { foreignKey: 'departmentId' });
Employee.belongsTo(Department, { foreignKey: 'departmentId' });

Designation.hasMany(Employee, { foreignKey: 'designationId' });
Employee.belongsTo(Designation, { foreignKey: 'designationId' });

User.hasOne(Employee, { foreignKey: 'userId' });
Employee.belongsTo(User, { foreignKey: 'userId' });

// HR Core Associations (Day 7-8)
Employee.hasMany(Attendance, { foreignKey: 'employeeId', onDelete: 'RESTRICT' });
Attendance.belongsTo(Employee, { foreignKey: 'employeeId' });

WorkShift.hasMany(Attendance, { foreignKey: 'workShiftId' });
Attendance.belongsTo(WorkShift, { foreignKey: 'workShiftId' });

Employee.hasMany(Leave, { foreignKey: 'employeeId' });
Leave.belongsTo(Employee, { foreignKey: 'employeeId' });

Employee.hasMany(LeaveBalance, { foreignKey: 'employeeId' });
LeaveBalance.belongsTo(Employee, { foreignKey: 'employeeId' });

// Payroll Associations (Day 9)
PayrollRun.hasMany(Payslip, { foreignKey: 'payrollRunId' });
Payslip.belongsTo(PayrollRun, { foreignKey: 'payrollRunId' });

Employee.hasMany(Payslip, { foreignKey: 'employeeId', onDelete: 'RESTRICT' });
Payslip.belongsTo(Employee, { foreignKey: 'employeeId' });

// User/Expense Associations
User.hasMany(Expense, { foreignKey: 'userId' });
Expense.belongsTo(User, { foreignKey: 'userId' });


// Supplier Associations (Day 12)
Supplier.hasMany(PurchaseOrder, { foreignKey: 'supplierId' });
PurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplierId' });

// AuditLog Associations
User.hasMany(AuditLog, { foreignKey: 'userId' });
AuditLog.belongsTo(User, { foreignKey: 'userId' });

// Customer Loyalty Associations
Customer.hasMany(LoyaltyTransaction, { foreignKey: 'customerId' });
LoyaltyTransaction.belongsTo(Customer, { foreignKey: 'customerId' });
Sale.hasMany(LoyaltyTransaction, { foreignKey: 'saleId' });
LoyaltyTransaction.belongsTo(Sale, { foreignKey: 'saleId' });

// POItem Associations
PurchaseOrder.hasMany(POItem, { as: 'Items', foreignKey: 'purchaseOrderId', onDelete: 'CASCADE' });
POItem.belongsTo(PurchaseOrder, { foreignKey: 'purchaseOrderId' });
Product.hasMany(POItem, { foreignKey: 'productId' });
POItem.belongsTo(Product, { foreignKey: 'productId' });

// SalaryAdvance & DocumentVault Associations
Employee.hasMany(SalaryAdvance, { foreignKey: 'employeeId' });
SalaryAdvance.belongsTo(Employee, { foreignKey: 'employeeId' });
Employee.hasMany(DocumentVault, { foreignKey: 'employeeId' });
DocumentVault.belongsTo(Employee, { foreignKey: 'employeeId' });

// Global Hook to convert empty strings to NULL
sequelize.addHook('beforeValidate', (instance) => {
  if (instance && instance.dataValues) {
    for (const key of Object.keys(instance.dataValues)) {
      if (instance.dataValues[key] === '') {
        instance.setDataValue(key, null);
      }
    }
  }
});

module.exports = {
  sequelize,
  User,
  Category,
  Product,
  ProductVariation,
  Customer,
  Sale,
  SaleItem,
  Employee,
  Expense,
  SalesSession,
  Ride,
  Bid,
  Rating,
  StockLog,
  Department,
  Designation,
  WorkShift,
  Attendance,
  Leave,
  LeaveBalance,
  PayrollRun,
  Payslip,

  Supplier,
  PurchaseOrder,
  AuditLog,
  LoyaltyTransaction,
  POItem,
  SalaryAdvance,
  DocumentVault
};
