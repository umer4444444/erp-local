const express = require('express');
const http = require('http');
const socket = require('./socket');
const cors = require('cors');
require('dotenv').config();
const { sequelize } = require('./models');

const app = express();
const server = http.createServer(app);
const io = socket.init(server);
// Socket.io CORS handled in socket.init

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/sales', require('./routes/sales'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/auth', require('./routes/auth'));

app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/hr', require('./routes/hr'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/shifts', require('./routes/shifts'));
app.use('/api/manager', require('./routes/manager'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/leaves', require('./routes/leaves'));
app.use('/api/payroll', require('./routes/payroll'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/pharmacy', require('./routes/pharmacy'));
app.use('/api/suppliers', require('./routes/suppliers'));

// Basic route
app.get('/', (req, res) => {
  res.send('ERP Ride-Sharing API is running...');
});

// Socket.IO logic
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

// Sync Database and Start Server
sequelize
  .query('SET FOREIGN_KEY_CHECKS = 0')
  .then(() => sequelize.sync({ alter: true }))
  .then(() => sequelize.query('ALTER TABLE Sales DROP FOREIGN KEY sales_ibfk_2').catch(() => console.log('FK already dropped')))
  .then(() => sequelize.query('SET FOREIGN_KEY_CHECKS = 1'))
  .then(() => {
    console.log('Database connected and synced.');
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
