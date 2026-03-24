// backend/socket/socketHandler.js

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Client sends { role: 'staff' | 'customer' } after connecting
    socket.on('join_room', ({ role }) => {
      if (role === 'staff' || role === 'admin') {
        socket.join('staff');
        console.log(`👨‍🍳 Staff joined room — socket ${socket.id}`);
      } else {
        socket.join('customers');
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });
};
