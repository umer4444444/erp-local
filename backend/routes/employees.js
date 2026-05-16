const express = require('express');
const { Employee, User, Department, Designation, sequelize } = require('../models');
const bcrypt = require('bcryptjs');
const { auth, roleCheck } = require('../middleware/auth');
const { Op } = require('sequelize');
const router = express.Router();

// ─── GET /api/departments ───────────────────────────────────────────────
router.get('/departments', auth, async (req, res) => {
  try {
    const departments = await Department.findAll({
      where: { status: 'active' },
      order: [['name', 'ASC']],
    });

    // Get employee counts per department
    const counts = await Employee.findAll({
      attributes: [
        'departmentId',
        [sequelize.fn('COUNT', sequelize.col('Employee.id')), 'count']
      ],
      where: { deletedAt: null },
      group: ['departmentId'],
      raw: true,
    });

    const countMap = {};
    counts.forEach(c => { countMap[c.departmentId] = parseInt(c.count); });

    const result = departments.map(d => ({
      ...d.toJSON(),
      employeeCount: countMap[d.id] || 0,
    }));

    res.json(result);
  } catch (err) {
    console.error('GET /departments error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/designations ──────────────────────────────────────────────
router.get('/designations', auth, async (req, res) => {
  try {
    const designations = await Designation.findAll({
      order: [['name', 'ASC']],
    });
    res.json(designations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/employees (paginated, filterable) ─────────────────────────
router.get('/', auth, roleCheck(['admin', 'hr', 'manager']), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      department = '',
      status = '',
    } = req.query;

    const where = {};

    // Search by name or emp code
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { empCode: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    // Filter by department
    if (department) {
      where.departmentId = department;
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows: employees, count: total } = await Employee.findAndCountAll({
      where,
      include: [
        { model: Department, attributes: ['id', 'name'] },
        { model: Designation, attributes: ['id', 'name', 'level'] },
        { model: User, attributes: ['id', 'name', 'email', 'role'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      employees,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error('GET /employees error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/employees/:id (full profile) ──────────────────────────────
router.get('/:id', auth, roleCheck(['admin', 'hr', 'manager']), async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      include: [
        { model: Department, attributes: ['id', 'name'] },
        { model: Designation, attributes: ['id', 'name', 'level'] },
        { model: User, attributes: ['id', 'name', 'email', 'role'] },
      ],
    });

    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/employees (create + auto-create user) ────────────────────
router.post('/', auth, roleCheck(['admin', 'hr', 'manager']), async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      firstName, lastName, email, cnic, phone,
      departmentId, designationId, joiningDate,
      salaryType, salary, baseSalary, payRate, bankAccount,
      position, status: empStatus
    } = req.body;

    // Pre-check: is email already used by another employee?
    const existingEmp = await Employee.findOne({ where: { email }, paranoid: false });
    if (existingEmp) {
      return res.status(400).json({ message: `An employee with email '${email}' already exists.` });
    }

    // Auto-generate empCode
    const lastEmp = await Employee.findOne({
      order: [['empCode', 'DESC']],
      attributes: ['empCode'],
      where: {
        empCode: {
          [Op.ne]: null,
        }
      },
      paranoid: false, // Include soft-deleted to ensure unique codes
      transaction,
    });

    let nextNum = 1;
    if (lastEmp && lastEmp.empCode) {
      const match = lastEmp.empCode.match(/EMP-(\d+)/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const empCode = `EMP-${String(nextNum).padStart(4, '0')}`;

    // Create employee record
    const employee = await Employee.create({
      empCode,
      firstName,
      lastName,
      email,
      cnic,
      phone,
      departmentId: departmentId || null,
      designationId: designationId || null,
      joiningDate,
      salaryType: salaryType || 'monthly',
      salary: salary || 0,
      baseSalary: baseSalary || salary || 0,
      payType: salaryType === 'hourly' ? 'hourly' : 'salary',
      payRate: payRate || 0,
      bankAccount,
      position: position || '',
      status: empStatus || 'active',
    }, { transaction });

    // Auto-create User account if none exists
    let user = await User.findOne({ where: { email }, transaction });

    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('staff123', salt);

      // Map position/department to role
      let deptName = '';
      if (departmentId) {
        const dept = await Department.findByPk(departmentId, { transaction });
        if (dept) deptName = dept.name.toLowerCase();
      }
      
      const pos = (position || '').toLowerCase();
      const roleStr = pos + ' ' + deptName;

      let role = 'cashier'; // fallback
      if (roleStr.includes('admin') || roleStr.includes('administration')) role = 'admin';
      else if (roleStr.includes('manager') || roleStr.includes('management')) role = 'manager';
      else if (roleStr.includes('inventory') || roleStr.includes('warehouse') || roleStr.includes('stock')) role = 'inventory';
      else if (roleStr.includes('hr') || roleStr.includes('human') || roleStr.includes('payroll')) role = 'hr';
      else if (roleStr.includes('pharmac')) role = 'pharmacist';
      else if (roleStr.includes('finance') || roleStr.includes('revenue')) role = 'manager';
      else if (roleStr.includes('expense')) role = 'expenses';
      else if (roleStr.includes('eod')) role = 'cashier';
      else if (roleStr.includes('sales') || roleStr.includes('cashier') || roleStr.includes('pos')) role = 'cashier';
      else if (roleStr.includes('operation')) role = 'cashier'; // EOD Operations

      // Ensure phone is unique — if already taken, generate a unique internal placeholder
      let userPhone = phone;
      if (userPhone) {
        const phoneExists = await User.findOne({ where: { phone: userPhone }, transaction });
        if (phoneExists) userPhone = null;
      }
      if (!userPhone) {
        userPhone = `INT-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
      }

      user = await User.create({
        name: `${firstName} ${lastName}`,
        email,
        phone: userPhone,
        passwordHash,
        role,
      }, { transaction });
    }

    // Link user to employee
    await employee.update({ userId: user.id }, { transaction });

    await transaction.commit();

    // Fetch full record with associations
    const fullEmployee = await Employee.findByPk(employee.id, {
      include: [
        { model: Department, attributes: ['id', 'name'] },
        { model: Designation, attributes: ['id', 'name', 'level'] },
        { model: User, attributes: ['id', 'name', 'email', 'role'] },
      ],
    });

    res.status(201).json(fullEmployee);
  } catch (err) {
    await transaction.rollback();
    console.error('POST /employees error:', err);
    // Surface a human-readable error from DB constraint violations
    if (err.name === 'SequelizeUniqueConstraintError') {
      const field = Object.keys(err.fields || {})[0] || 'field';
      return res.status(400).json({ message: `Duplicate value for '${field}'. This record already exists.` });
    }
    res.status(400).json({ message: err.message });
  }
});

// ─── PUT /api/employees/:id (update) ────────────────────────────────────
router.put('/:id', auth, roleCheck(['admin', 'hr']), async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const {
      firstName, lastName, email, cnic, phone,
      departmentId, designationId, joiningDate,
      salaryType, salary, baseSalary, payRate, bankAccount,
      position, status: empStatus
    } = req.body;

    await employee.update({
      firstName: firstName ?? employee.firstName,
      lastName: lastName ?? employee.lastName,
      email: email ?? employee.email,
      cnic: cnic ?? employee.cnic,
      phone: phone ?? employee.phone,
      departmentId: departmentId ?? employee.departmentId,
      designationId: designationId ?? employee.designationId,
      joiningDate: joiningDate ?? employee.joiningDate,
      salaryType: salaryType ?? employee.salaryType,
      salary: salary ?? employee.salary,
      baseSalary: baseSalary ?? employee.baseSalary,
      payRate: payRate ?? employee.payRate,
      payType: salaryType === 'hourly' ? 'hourly' : (salaryType === 'monthly' ? 'salary' : employee.payType),
      bankAccount: bankAccount ?? employee.bankAccount,
      position: position ?? employee.position,
      status: empStatus ?? employee.status,
    });

    const fullEmployee = await Employee.findByPk(employee.id, {
      include: [
        { model: Department, attributes: ['id', 'name'] },
        { model: Designation, attributes: ['id', 'name', 'level'] },
        { model: User, attributes: ['id', 'name', 'email', 'role'] },
      ],
    });

    res.json(fullEmployee);
  } catch (err) {
    console.error('PUT /employees error:', err);
    res.status(400).json({ message: err.message });
  }
});

// ─── DELETE /api/employees/:id (soft-delete) ────────────────────────────
router.delete('/:id', auth, roleCheck(['admin', 'hr']), async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    // Soft-delete (paranoid mode sets deletedAt)
    await employee.destroy();

    // Deactivate linked User account
    if (employee.userId) {
      await User.update({ isActive: false }, { where: { id: employee.userId } });
    }

    res.json({ message: 'Employee archived successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
