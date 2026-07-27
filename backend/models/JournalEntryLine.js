const uuidv7 = () => require('crypto').randomUUID();
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const JournalEntryLine = sequelize.define('JournalEntryLine', {
  id: {
    type: DataTypes.UUID,
    defaultValue: uuidv7,
    primaryKey: true,
  },
  journalEntryId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  accountId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  debit: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
  },
  credit: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
  },
  description: {
    type: DataTypes.STRING,
  },
}, {
  tableName: 'journal_entry_lines',
  freezeTableName: true,
  timestamps: true,
});

module.exports = JournalEntryLine;
