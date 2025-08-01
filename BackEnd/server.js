const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path'); // Add path module

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:5500"], // Front end served from same port
    methods: ["GET", "POST"],
  },
});

// Serve static files from the FrontEnd folder
app.use(express.static(path.join(__dirname, '../FrontEnd')));

// Serve index.html for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../FrontEnd', 'index.html'));
});

// Real-time chat using Socket.IO
const users = new Map(); // Store user data: socket.id -> { userName, room }

io.on('connection', (socket) => {
  // console.log(`${socket.id} : user connected`);

  socket.on('joinRoom', (data) => {
      const {  userName, room } = data;
      
      if (!userName || !room ) {
          console.error('Room or UserName missing in data');
          return;
      }

      socket.join(room);
      socket.currentRoom = room;
      socket.userName = userName || 'Anonymous';
      users.set(socket.id, { userName: socket.userName, room });

      console.log(`${socket.userName} (${socket.id}) joined room ${room}`);

      // Notify the room about the new user
      io.to(room).emit('chatMessage', {
          sender: socket.userName,
          message: `${socket.userName} has joined the chat.`,
          timestamp: formatDateTimeNow(),
          source: 'SYSTEM',
          room
      });

      // Broadcast updated user list to all clients
      io.emit('userList', Array.from(users.values()));
  });

  // Listen for chat messages
  socket.on('chatMessage', (data) => {
      const messageData = {
          sender: data.sender || socket.userName || 'Anonymous',
          message: data.message,
          timestamp: formatDateTimeNow(),
          source: 'SENDING',
          room: data.room || socket.currentRoom
      };

      io.to(messageData.room).emit('chatMessage', messageData);
      console.log('Message sent to room:', messageData);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
      const userName = socket.userName || 'Anonymous';
      const room = socket.currentRoom;

      if (room) {
          io.to(room).emit('chatMessage', {
              sender: userName,
              message: `${userName} has left the chat.`,
              timestamp: formatDateTimeNow(),
              source: 'SYSTEM',
              room
          });
      }

      // Remove user from list and broadcast update
      users.delete(socket.id);
      io.emit('userList', Array.from(users.values()));
      console.log(`${userName} disconnected${room ? ` from room ${room}` : ''}`);
  });


  
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Chat Server is running on http://localhost:${PORT}`);
});

function formatDateTimeNow() {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Get month and pad with 0
    const day = String(date.getDate()).padStart(2, '0'); // Get day and pad with 0
    const year = date.getFullYear();
    const time = new Date().toLocaleTimeString();
    return `${month}/${day}/${year} ${time}`; 
};

