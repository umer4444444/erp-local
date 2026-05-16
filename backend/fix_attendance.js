const { Attendance, Employee, User } = require('./models');

async function fixAttendance() {
  try {
    // 1. Find the admin/user
    const user = await User.findOne({ where: { email: 'admin@erp.com' } }); // Adjust email if needed
    if (!user) return console.log('User not found');

    const employee = await Employee.findOne({ where: { userId: user.id } });
    if (!employee) return console.log('Employee profile not found');

    console.log(`Fixing attendance for ${employee.firstName}...`);

    // 2. Find any attendance records with NULL clockOut
    const stuck = await Attendance.findAll({
      where: { employeeId: employee.id, clockOut: null }
    });

    console.log(`Found ${stuck.length} stuck records.`);

    // 3. Force close them or delete them
    // Option: Force close them to now
    for (const record of stuck) {
      await record.update({ clockOut: new Date() });
      console.log(`Closed record ${record.id}`);
    }

    console.log('✅ Done. You should be able to clock in fresh now.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixAttendance();
