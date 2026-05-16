const { User, Employee } = require('./models');

async function debug() {
  const users = await User.findAll({ attributes: ['id', 'name', 'email', 'role'] });
  const employees = await Employee.findAll({ attributes: ['id', 'firstName', 'lastName', 'userId'] });
  
  console.log('--- USERS ---');
  console.table(users.map(u => u.toJSON()));
  
  console.log('--- EMPLOYEES ---');
  console.table(employees.map(e => e.toJSON()));
  
  process.exit(0);
}

debug();
