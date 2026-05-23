const socketIo = require('socket.io');
let io = null;

function init(server) {
  if (io) return io; // already initialized
  io = socketIo(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });
  io.on('connection', socket => {
    console.log('Socket client connected:', socket.id);
  });
  return io;
}

function getIo() {
  return io;
}

module.exports = { init, getIo };
