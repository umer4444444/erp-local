const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  empCode: {
    type: DataTypes.STRING,
    unique: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fullName: {
    type: DataTypes.VIRTUAL,
    get() {
      return `${this.firstName} ${this.lastName}`;
    },
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  cnic: {
    type: DataTypes.STRING,
  },
  phone: {
    type: DataTypes.STRING,
  },
  position: {
    type: DataTypes.STRING,
  },
  departmentId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  designationId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  salary: {
    type: DataTypes.DECIMAL(12, 2),
  },
  salaryType: {
    type: DataTypes.ENUM('monthly', 'hourly'),
    defaultValue: 'monthly',
  },
  bankAccount: {
    type: DataTypes.STRING,
  },
  joiningDate: {
    type: DataTypes.DATEONLY,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'on_leave', 'resigned'),
    defaultValue: 'active',
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  timestamps: true,
  paranoid: true,
});

module.exports = Employee;
