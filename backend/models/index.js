const sequelize = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
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
const Drug = require('./Drug');
const Prescription = require('./Prescription');
const PrescriptionItem = require('./PrescriptionItem');
const Supplier = require('./Supplier');
const PurchaseOrder = require('./PurchaseOrder');

// Inventory Associations
Category.hasMany(Product, { foreignKey: 'categoryId' });
Product.belongsTo(Category, { foreignKey: 'categoryId' });

Product.hasMany(StockLog, { foreignKey: 'productId' });
StockLog.belongsTo(Product, { foreignKey: 'productId' });

User.hasMany(StockLog, { foreignKey: 'userId' });
StockLog.belongsTo(User, { foreignKey: 'userId' });

// Sales Associations
Customer.hasMany(Sale, { foreignKey: 'customerId' });
Sale.belongsTo(Customer, { foreignKey: 'customerId' });

User.hasMany(Sale, { foreignKey: 'userId' });
Sale.belongsTo(User, { foreignKey: 'userId' });

Sale.hasMany(SaleItem, { as: 'Items', foreignKey: 'saleId' });
SaleItem.belongsTo(Sale, { foreignKey: 'saleId' });

Product.hasMany(SaleItem, { foreignKey: 'productId' });
SaleItem.belongsTo(Product, { foreignKey: 'productId' });

// User/SalesSession Associations
User.hasMany(SalesSession, { foreignKey: 'userId' });
SalesSession.belongsTo(User, { foreignKey: 'userId' });

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
Employee.hasMany(Attendance, { foreignKey: 'employeeId' });
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

Employee.hasMany(Payslip, { foreignKey: 'employeeId' });
Payslip.belongsTo(Employee, { foreignKey: 'employeeId' });

// User/Expense Associations
User.hasMany(Expense, { foreignKey: 'userId' });
Expense.belongsTo(User, { foreignKey: 'userId' });

// Pharmacy Associations (Day 11)
Product.hasOne(Drug, { foreignKey: 'productId' });
Drug.belongsTo(Product, { foreignKey: 'productId' });

Customer.hasMany(Prescription, { foreignKey: 'customerId' });
Prescription.belongsTo(Customer, { foreignKey: 'customerId' });

Prescription.hasMany(PrescriptionItem, { as: 'Items', foreignKey: 'prescriptionId' });
PrescriptionItem.belongsTo(Prescription, { foreignKey: 'prescriptionId' });

Drug.hasMany(PrescriptionItem, { foreignKey: 'drugId' });
PrescriptionItem.belongsTo(Drug, { foreignKey: 'drugId' });

// Supplier Associations (Day 12)
Supplier.hasMany(PurchaseOrder, { foreignKey: 'supplierId' });
PurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplierId' });

module.exports = {
  sequelize,
  User,
  Category,
  Product,
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
  Drug,
  Prescription,
  PrescriptionItem,
  Supplier,
  PurchaseOrder
};
