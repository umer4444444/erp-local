const express = require('express');
const { PayrollRun, Payslip, Employee, User, Attendance, Leave, SalaryAdvance, LeaveBalance } = require('../models');
const { Op } = require('sequelize');
const { auth, roleCheck } = require('../middleware/auth');
const audit = require('../middleware/audit');
const router = express.Router();

// Run Payroll for a month
router.post('/run', auth, roleCheck(['admin', 'hr']), audit('payroll'), async (req, res) => {
  try {
    const { month, year } = req.body;
    
    const existing = await PayrollRun.findOne({ where: { month, year } });
    if (existing) {
      return res.status(409).json({ 
        message: `Payroll run already exists for ${month}/${year} (ID: ${existing.id}, status: ${existing.status})` 
      });
    }

    const employees = await Employee.findAll({ include: [User] });
    
    const employeesWithNoSalary = employees.filter(e => !e.salary || parseFloat(e.salary) === 0);
    if (employeesWithNoSalary.length > 0 && !req.body.forceZeroSalary) {
      return res.status(422).json({
        message: `${employeesWithNoSalary.length} employee(s) have no salary configured`,
        employees: employeesWithNoSalary.map(e => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }))
      });
    }

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
      let base = parseFloat(emp.salary || 0);
      
      // Calculate hourly salary if salaryType === 'hourly'
      if (emp.salaryType === 'hourly') {
        const attendances = await Attendance.findAll({
          where: {
            employeeId: emp.id,
            clockIn: { [Op.between]: [startDate, endDate] }
          }
        });
        let totalHours = 0;
        for (const att of attendances) {
          if (att.clockIn && att.clockOut) {
            const diffMs = new Date(att.clockOut) - new Date(att.clockIn);
            let shiftHours = Math.max(0, diffMs / (1000 * 60 * 60));
            if (shiftHours > 9) shiftHours = 9; // Cap at 9 duty hours
            totalHours += shiftHours;
          } else if (att.clockIn && !att.clockOut) {
            // Standard duty shift cap
            totalHours += 9;
          }
        }
        base = parseFloat((totalHours * parseFloat(emp.salary || 0)).toFixed(2));
      }

      const allowances = 0;
      let deductions = 0;
      
      // 1. Unpaid Leaves deduction
      const explicitUnpaid = await Leave.sum('days', {
        where: {
          employeeId: emp.id,
          status: 'approved',
          type: 'unpaid',
          startDate: { [Op.between]: [startDate, endDate] }
        }
      }) || 0;
      
      let totalUnpaidDays = parseFloat(explicitUnpaid);
      
      const balances = await LeaveBalance.findAll({ where: { employeeId: emp.id } });
      for (const b of balances) {
        const priorLeaves = await Leave.sum('days', {
          where: { employeeId: emp.id, type: b.type, status: 'approved', startDate: { [Op.lt]: startDate } }
        }) || 0;
        
        const monthLeaves = await Leave.sum('days', {
          where: { employeeId: emp.id, type: b.type, status: 'approved', startDate: { [Op.between]: [startDate, endDate] } }
        }) || 0;
        
        const availableAtStart = Math.max(0, parseFloat(b.total) - parseFloat(priorLeaves));
        
        if (monthLeaves > availableAtStart) {
          totalUnpaidDays += parseFloat(monthLeaves) - availableAtStart;
        }
      }

      const dailyRate = base / 30;
      deductions += parseFloat((totalUnpaidDays * dailyRate).toFixed(2));

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

    const totalAmount = await Payslip.sum('netSalary', { where: { payrollRunId: run.id } });
    await run.update({ totalAmount });

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

// Get my own advances (for employee portal)
router.get('/advance/my', auth, async (req, res) => {
  try {
    const employee = await Employee.findOne({ where: { userId: req.user.id } });
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });

    const advances = await SalaryAdvance.findAll({
      where: { employeeId: employee.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(advances);
  } catch (err) {
    res.status(500).json({ message: err.message });
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

// Finalize a draft payroll run (DRAFT → PROCESSED)
router.put('/runs/:id/finalize', auth, roleCheck(['admin', 'hr']), audit('payroll'), async (req, res) => {
  try {
    const run = await PayrollRun.findByPk(req.params.id);
    if (!run) return res.status(404).json({ message: 'Payroll run not found' });
    if (run.status === 'processed') return res.status(400).json({ message: 'Payroll run is already finalized.' });

    // Mark all payslips in this run as paid
    await Payslip.update({ status: 'paid' }, { where: { payrollRunId: run.id } });
    await run.update({ status: 'processed' });

    res.json(run);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
