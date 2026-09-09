module.exports = (io) => {
  io.on('connection', (socket) => {
    socket.on('join:seats', ({ locationCode, date }) => {
      const room = `seats:${locationCode}`;
      socket.join(room);
    });

    socket.on('leave:seats', ({ locationCode }) => {
      socket.leave(`seats:${locationCode}`);
    });

    socket.on('disconnect', () => {});
  });
};
