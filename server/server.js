const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// SERVE STATIC FILES
app.use(express.static(path.join(__dirname, '..')));

// TRACK ROOMS
const rooms = {};

io.on('connection', (socket) => {
    console.log('Player connected: ' + socket.id);

    socket.on('joinRoom', (roomId) => {
        console.log('Player joining room: ' + roomId);

        if (!rooms[roomId]) {
            rooms[roomId] = [];
        }

        if (rooms[roomId].length >= 2) {
            socket.emit('roomFull', 'Room is full');
            return;
        }

        rooms[roomId].push(socket.id);
        socket.join(roomId);

        // ASSIGN COLOR
        if (rooms[roomId].length === 1) {
            socket.emit('assignColor', 'white');
            console.log('Assigned white to: ' + socket.id);
        } else {
            socket.emit('assignColor', 'black');
            console.log('Assigned black to: ' + socket.id);
        }
    });

    socket.on('move', (moveData) => {
        console.log('Move received: ' + moveData);

        // FORMAT: "FROM:TO:roomId"
        const parts = moveData.split(':');
        if (parts.length < 3) {
            console.log('Invalid move format: ' + moveData);
            return;
        }

        const roomId = parts[2];
        const moveToSend = parts[0] + ':' + parts[1];

        // SEND TO OTHER PLAYER IN ROOM ONLY
        socket.to(roomId).emit('opponentMove', moveToSend);
        console.log('Sent move to room ' + roomId + ': ' + moveToSend);
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected: ' + socket.id);

        // REMOVE FROM ROOM
        for (const roomId in rooms) {
            const index = rooms[roomId].indexOf(socket.id);
            if (index !== -1) {
                rooms[roomId].splice(index, 1);
                // NOTIFY OTHER PLAYER
                socket.to(roomId).emit('opponentDisconnected', '');
                console.log('Removed from room: ' + roomId);

                // CLEAN UP EMPTY ROOMS
                if (rooms[roomId].length === 0) {
                    delete rooms[roomId];
                }
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('Chess server running on port ' + PORT);
});