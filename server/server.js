const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

let rooms = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinRoom', (roomId) => {
    if (!rooms[roomId]) rooms[roomId] = [];
    if (rooms[roomId].length >= 2) {
      socket.emit('roomFull');
      return;
    }
    rooms[roomId].push(socket.id);
    socket.join(roomId);
    const color = rooms[roomId].length === 1 ? 'white' : 'black';
    socket.emit('assignColor', color);
    if (rooms[roomId].length === 2) {
      io.to(roomId).emit('startGame');
    }
  });

  socket.on('move', (data) => {
    socket.to(data.roomId).emit('opponentMove', data.move);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});