const { sequelize, Employee, Department, Designation, User } = require('./models');

async function fix() {
  try {
    const adminDept = await Department.findOne({ where: { name: 'Admin' } }) || await Department.create({ name: 'Admin', description: 'Administration' });
    const adminDesig = await Designation.findOne({ where: { name: 'Administrator' } }) || await Designation.create({ name: 'Administrator', level: 'manager', departmentId: adminDept.id });

    const employees = await Employee.findAll({
      where: {
        departmentId: null
      }
    });

    for (let emp of employees) {
      if (!emp.empCode) {
        emp.empCode = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
      }
      emp.departmentId = adminDept.id;
      emp.designationId = adminDesig.id;
      if (!emp.cnic) emp.cnic = '00000-0000000-0';
      if (!emp.address) emp.address = 'Default Address';
      await emp.save();
    }
    console.log(`Fixed ${employees.length} corrupted employee records.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fix();
