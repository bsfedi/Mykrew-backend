const socketIO = require('socket.io');

let io;

function initializeSocket(server) {
    io = socketIO(server, {
        cors: {
            origin: '*',
        }
    });

    io.on('connection', (socket) => {
        console.log('A user connected');
    });

    return io;
}

function getIO() {
    if (!io) {
        console.log("Socket.IO is not initialized");
        throw new Error('Socket.IO is not initialized');
    }
    return io;
}

module.exports = { initializeSocket, getIO };
