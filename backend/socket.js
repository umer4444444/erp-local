const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
let io = null;

function init(server) {
  if (io) return io; // already initialized
  
  const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',') 
    : ['http://localhost:5173'];

  io = socketIo(server, {
    cors: {
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // JWT socket authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers['authorization'];
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }
      
      const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
      jwt.verify(cleanToken, process.env.JWT_SECRET || 'your_secret_key', (err, decoded) => {
        if (err) {
          return next(new Error('Authentication error: Invalid token'));
        }
        socket.user = decoded;
        next();
      });
    } catch (err) {
      next(new Error('Authentication error: Server error'));
    }
  });

  io.on('connection', socket => {
    console.log('Authenticated socket client connected:', socket.id, 'User:', socket.user?.email);
  });
  return io;
}

function getIo() {
  return io;
}

module.exports = { init, getIo };
