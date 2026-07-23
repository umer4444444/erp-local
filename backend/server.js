const express = require('express');
const http = require('http');
const socket = require('./socket');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const { sequelize } = require('./models');

const app = express();
const server = http.createServer(app);

// Disable Powered-By header
app.disable('x-powered-by');

// Security headers via Helmet (with script evaluation relaxed for local setup)
app.use(helmet({
  contentSecurityPolicy: false,
}));

// CORS Configuration
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',') 
  : ['http://localhost:5173'];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    // Or if origin is in the allowed list
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
app.use(cors(corsOptions));

// Socket.io initialization with credentials and security CORS
const io = socket.init(server);

app.use(express.json());

// Global XSS Sanitization Middleware
function sanitizeHtml(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
            .replace(/on\w+="[^"]*"/gi, '')
            .replace(/on\w+='[^']*'/gi, '')
            .replace(/javascript:[^"']*/gi, '');
}
function sanitizeObject(obj) {
  if (!obj) return obj;
  for (let key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = sanitizeHtml(obj[key]);
    } else if (typeof obj[key] === 'object') {
      sanitizeObject(obj[key]);
    }
  }
}
app.use((req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  next();
});

// Rate Limiting (Brute force protection)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { message: 'Too many login attempts from this IP, please try again after 15 minutes.' }
});
app.use('/api/auth/login', loginLimiter);

// Routes
app.use('/api/public', require('./routes/public'));
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
app.use('/api/settings', require('./routes/settings'));

app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/rides', require('./routes/rides'));
app.use('/api/reports', require('./routes/reports'));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: 'connected',
    jwt: !!process.env.JWT_SECRET,
    socket: io ? 'running' : 'stopped',
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

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

const PORT = process.env.PORT || 5002;

// Startup Validation
const requiredEnvVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'JWT_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`[FATAL] Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Sync Database and Start Server
const isProduction = process.env.NODE_ENV === 'production';
sequelize
  .authenticate()
  .then(() => {
    console.log('Database connection verified.');
    // Validate required tables exist
    return sequelize.getQueryInterface().showAllTables().then(tables => {
      const requiredTables = ['users', 'employees', 'departments'];
      const missing = requiredTables.filter(t => !tables.includes(t));
      if (missing.length > 0) {
        console.error(`[FATAL] Missing required database tables: ${missing.join(', ')}. Please run 'npm run db:init'`);
        process.exit(1);
      }
      server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    });
  })
  .catch(err => {
    console.error('[FATAL] Unable to connect to the database:', err.message);
    process.exit(1);
  });
