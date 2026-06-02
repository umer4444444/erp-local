const express = require('express');
const { PayrollRun, Payslip, Employee, User, Attendance, Leave, SalaryAdvance } = require('../models');
const { Op } = require('sequelize');
const { auth, roleCheck } = require('../middleware/auth');
const audit = require('../middleware/audit');
const router = express.Router();

// Run Payroll for a month
router.post('/run', auth, roleCheck(['admin', 'hr']), audit('payroll'), async (req, res) => {
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
      const base = parseFloat(emp.salary || 0);
      const allowances = 0;
      let deductions = 0;
      
      // 1. Unpaid Leaves deduction
      const unpaidLeaves = await Leave.sum('days', {
        where: {
          employeeId: emp.id,
          status: 'approved',
          type: 'unpaid',
          startDate: { [Op.between]: [startDate, endDate] }
        }
      }) || 0;

      const dailyRate = base / 30;
      deductions += parseFloat((unpaidLeaves * dailyRate).toFixed(2));

      // 2. Hyper-Automated Late Deduction (15-min deduction)
      const totalLateMinutes = await Attendance.sum('lateMinutes', {
        where: {
          employeeId: emp.id,
          clockIn: { [Op.between]: [startDate, endDate] }
        }
      }) || 0;
      const hourlyRate = dailyRate / 8;
      const minuteRate = hourlyRate / 60;
      const lateDeduction = parseFloat((totalLateMinutes * minuteRate).toFixed(2));
      deductions += lateDeduction;

      // 3. Advance Salary Deduction
      const activeAdvance = await SalaryAdvance.findOne({
        where: {
          employeeId: emp.id,
          status: 'approved',
          remainingAmount: { [Op.gt]: 0 }
        }
      });

      let advanceDeducted = 0;
      if (activeAdvance) {
        const monthlyInstallment = parseFloat((parseFloat(activeAdvance.amount) / activeAdvance.deductionMonths).toFixed(2));
        advanceDeducted = Math.min(monthlyInstallment, parseFloat(activeAdvance.remainingAmount));
        deductions += advanceDeducted;
        
        await activeAdvance.update({ remainingAmount: parseFloat(activeAdvance.remainingAmount) - advanceDeducted });
      }

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
router.put('/payslips/:id', auth, roleCheck(['admin', 'hr']), audit('payroll'), async (req, res) => {
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

// Request salary advance
router.post('/advance/request', auth, audit('payroll'), async (req, res) => {
  try {
    const { amount, deductionMonths, reason } = req.body;
    const employee = await Employee.findOne({ where: { userId: req.user.id } });
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });

    const advance = await SalaryAdvance.create({
      employeeId: employee.id,
      amount: parseFloat(amount),
      deductionMonths: parseInt(deductionMonths || 1),
      remainingAmount: parseFloat(amount),
      reason: reason || null,
      status: 'pending'
    });
    res.status(201).json(advance);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get pending advances for approval
router.get('/advance/pending', auth, roleCheck(['admin', 'hr']), async (req, res) => {
  try {
    const advances = await SalaryAdvance.findAll({
      include: [{ model: Employee, include: [User] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(advances);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approve/reject advance salary request
router.put('/advance/:id/approve', auth, roleCheck(['admin', 'hr']), audit('payroll'), async (req, res) => {
  try {
    const { status } = req.body;
    const advance = await SalaryAdvance.findByPk(req.params.id);
    if (!advance) return res.status(404).json({ message: 'Advance request not found' });

    await advance.update({
      status,
      approvedBy: req.user.id
    });
    res.json(advance);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
