const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { ChartOfAccount, JournalEntry, JournalEntryLine, sequelize } = require('../models');

// GET /api/accounting/accounts
router.get('/accounts', auth, async (req, res) => {
  try {
    const accounts = await ChartOfAccount.findAll({
      where: { companyId: req.user.companyId },
      order: [['code', 'ASC']]
    });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/accounting/accounts
router.post('/accounts', auth, async (req, res) => {
  try {
    const { code, name, type } = req.body;
    const account = await ChartOfAccount.create({
      companyId: req.user.companyId,
      code,
      name,
      type
    });
    res.status(201).json(account);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/accounting/journal-entries
router.get('/journal-entries', auth, async (req, res) => {
  try {
    const entries = await JournalEntry.findAll({
      where: { companyId: req.user.companyId },
      include: [{ model: JournalEntryLine, as: 'Lines', include: [ChartOfAccount] }],
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/accounting/journal-entries (Manual entry)
router.post('/journal-entries', auth, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { date, reference, description, lines } = req.body;
    
    // Validate balancing
    const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({ error: 'Journal entry does not balance' });
    }

    const entry = await JournalEntry.create({
      companyId: req.user.companyId,
      date: date || new Date(),
      reference,
      description,
      status: 'posted'
    }, { transaction });

    for (const line of lines) {
      await JournalEntryLine.create({
        journalEntryId: entry.id,
        accountId: line.accountId,
        debit: line.debit || 0,
        credit: line.credit || 0,
        description: line.description
      }, { transaction });
    }

    await transaction.commit();
    res.status(201).json(entry);
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: error.message });
  }
});

// GET /api/accounting/trial-balance
router.get('/trial-balance', auth, async (req, res) => {
  try {
    const accounts = await ChartOfAccount.findAll({
      where: { companyId: req.user.companyId },
      order: [['code', 'ASC']]
    });
    
    // We can do this in SQL, but for MVP we'll aggregate here
    const lines = await JournalEntryLine.findAll({
      include: [{
        model: JournalEntry,
        where: { companyId: req.user.companyId, status: 'posted' },
        attributes: []
      }]
    });
    
    const balanceMap = {};
    for (const line of lines) {
      if (!balanceMap[line.accountId]) balanceMap[line.accountId] = { debit: 0, credit: 0 };
      balanceMap[line.accountId].debit += Number(line.debit);
      balanceMap[line.accountId].credit += Number(line.credit);
    }
    
    const trialBalance = accounts.map(acc => {
      const bals = balanceMap[acc.id] || { debit: 0, credit: 0 };
      let balance = 0;
      if (['asset', 'expense'].includes(acc.type)) {
        balance = bals.debit - bals.credit;
      } else {
        balance = bals.credit - bals.debit;
      }
      return {
        ...acc.toJSON(),
        totalDebit: bals.debit,
        totalCredit: bals.credit,
        balance
      };
    });
    
    res.json(trialBalance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
