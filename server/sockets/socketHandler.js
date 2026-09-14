let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io;

  io.on("connection", (socket) => {
    // console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      // console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });

    socket.on("ping:client", () => {
      socket.emit("pong:server", { timestamp: Date.now() });
    });
  });
};

const getIO = () => ioInstance;

const broadcast = (event, data) => {
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
};

module.exports = {
  initSocket,
  getIO,
  broadcast
};
