const uuidv7 = () => require('crypto').randomUUID();
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LeaveBalance = sequelize.define('LeaveBalance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: uuidv7,
    primaryKey: true,
  },
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('casual', 'medical', 'annual'),
    allowNull: false,
  },
  total: {
    type: DataTypes.DECIMAL(4, 1),
    defaultValue: 0,
  },
  used: {
    type: DataTypes.DECIMAL(4, 1),
    defaultValue: 0,
  },
  remaining: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.total - this.used;
    }
  }
}, {
  tableName: 'leave_balances',
  freezeTableName: true,
  timestamps: true,
  underscored: false,
  timestamps: true,
});

module.exports = LeaveBalance;
