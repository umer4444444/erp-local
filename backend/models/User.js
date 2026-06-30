const { v7: uuidv7 } = require('uuid');
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: uuidv7,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'manager', 'cashier', 'hr', 'inventory', 'pharmacist', 'expenses'),
    defaultValue: 'cashier',
    allowNull: false,
  },
  profileImage: {
    type: DataTypes.STRING,
  },
  // Driver specific fields (flattened for SQL)
  vehicle_make: {
    type: DataTypes.STRING,
  },
  vehicle_model: {
    type: DataTypes.STRING,
  },
  vehicle_plate: {
    type: DataTypes.STRING,
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  location: {
    type: DataTypes.GEOMETRY('POINT'),
    allowNull: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  indexes: [
    {
      type: 'SPATIAL',
      fields: ['location'],
    }
  ]
});

// Instance method to compare password
User.prototype.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.passwordHash);
};

module.exports = User;
