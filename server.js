const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

const rooms = {}; // Track rooms and users

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push(socket.id);
    io.to(roomId).emit('playerCount', rooms[roomId].length);
  });

  socket.on('generateLetter', ({ roomId, letter }) => {
    io.to(roomId).emit('receiveLetter', letter);
  });

  socket.on('submitAnswers', ({ roomId, player, answers }) => {
    io.to(roomId).emit('receiveAnswers', { player, answers });
  });

  socket.on('disconnecting', () => {
    for (let room of socket.rooms) {
      if (rooms[room]) {
        rooms[room] = rooms[room].filter(id => id !== socket.id);
        io.to(room).emit('playerCount', rooms[room].length);
      }
    }
  });
});

app.use(express.static(path.join(__dirname, 'public')));

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));