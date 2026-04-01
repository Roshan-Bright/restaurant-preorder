// backend/socket/socketHandler.js
module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Client sends { role, restaurant_id }
    socket.on('join_room', ({ role, restaurant_id }) => {
      if (role === 'admin') {
        socket.join('admin');
        console.log(`Admin joined — socket ${socket.id}`);
      } else if (role === 'staff' && restaurant_id) {
        socket.join(`restaurant_${restaurant_id}`);
        console.log(`Staff joined restaurant_${restaurant_id} — socket ${socket.id}`);
      } else {
        socket.join('customers');
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
