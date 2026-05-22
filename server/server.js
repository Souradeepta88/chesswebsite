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
    
    console.log('Assigning color: ' + color + ' to ' + socket.id);
    socket.emit('assignColor', color);

    if (rooms[roomId].length === 2) {
      console.log('Starting game in room: ' + roomId);
      io.to(roomId).emit('startGame');
    }
  });

  socket.on('move', (data) => {
    console.log('Move received: ' + JSON.stringify(data));
    socket.to(data.roomId).emit('opponentMove', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (let roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
      if (rooms[roomId].length === 0) delete rooms[roomId];
    }
  });
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});