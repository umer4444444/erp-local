const { User, Employee, Attendance } = require('./models');

async function repair() {
  try {
    // 1. Get Admin User
    const admin = await User.findOne({ where: { email: 'admin@erp.com' } });
    
    // 2. Check if admin has an employee profile
    let employee = await Employee.findOne({ where: { userId: admin.id } });
    
    if (!employee) {
      console.log('Admin has no employee profile. Creating one...');
      employee = await Employee.create({
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@erp.com',
        userId: admin.id,
        position: 'Administrator',
        status: 'active'
      });
      console.log('Employee profile created.');
    }

    // 3. Clear ANY stuck attendance for this employee
    const stuck = await Attendance.findAll({
      where: { employeeId: employee.id, clockOut: null }
    });

    console.log(`Closing ${stuck.length} stuck sessions...`);
    for (const record of stuck) {
      await record.update({ clockOut: new Date() });
    }

    console.log('✅ Success. Admin is now linked to an Employee profile and attendance is cleared.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

repair();
