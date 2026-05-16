const express = require('express');
const { PayrollRun, Payslip, Employee, User, Attendance, Leave } = require('../models');
const { Op } = require('sequelize');
const { auth, roleCheck } = require('../middleware/auth');
const router = express.Router();

// Run Payroll for a month
router.post('/run', auth, roleCheck(['admin', 'hr']), async (req, res) => {
  try {
    const { month, year } = req.body;
    
    const employees = await Employee.findAll({ include: [User] });
    
    const run = await PayrollRun.create({
      month,
      year,
      processedBy: req.user.id,
      processedAt: new Date(),
      status: 'draft'
    });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    for (const emp of employees) {
      const base = parseFloat(emp.baseSalary || 0);
      const allowances = 0;
      
      const unpaidLeaves = await Leave.sum('days', {
        where: {
          employeeId: emp.id,
          status: 'approved',
          type: 'unpaid',
          startDate: { [Op.between]: [startDate, endDate] }
        }
      });

      const dailyRate = base / 30;
      const deductions = parseFloat(((unpaidLeaves || 0) * dailyRate).toFixed(2));
      const net = base + allowances - deductions;

      await Payslip.create({
        employeeId: emp.id,
        payrollRunId: run.id,
        baseSalary: base,
        allowances,
        deductions,
        netSalary: net,
        status: 'unpaid'
      });
    }

    res.status(201).json(run);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get payroll runs
router.get('/history', auth, roleCheck(['admin', 'hr']), async (req, res) => {
  try {
    const runs = await PayrollRun.findAll({ order: [['createdAt', 'DESC']] });
    res.json(runs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get payslips for a run
router.get('/runs/:id/payslips', auth, roleCheck(['admin', 'hr']), async (req, res) => {
  try {
    const payslips = await Payslip.findAll({
      where: { payrollRunId: req.params.id },
      include: [{ model: Employee, include: [User] }]
    });
    res.json(payslips);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a payslip (allowances/deductions override)
router.put('/payslips/:id', auth, roleCheck(['admin', 'hr']), async (req, res) => {
  try {
    const payslip = await Payslip.findByPk(req.params.id);
    if (!payslip) return res.status(404).json({ message: 'Payslip not found' });

    const { allowances, deductions, note } = req.body;
    const base = parseFloat(payslip.baseSalary);
    const newAllowances = allowances !== undefined ? parseFloat(allowances) : parseFloat(payslip.allowances);
    const newDeductions = deductions !== undefined ? parseFloat(deductions) : parseFloat(payslip.deductions);
    const net = base + newAllowances - newDeductions;

    await payslip.update({
      allowances: newAllowances,
      deductions: newDeductions,
      netSalary: parseFloat(net.toFixed(2)),
    });

    res.json(payslip);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
