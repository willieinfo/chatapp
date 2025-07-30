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
io.on('connection', (socket) => {
  console.log(`${socket.id} : user connected`);

  // socket.on('chatMessage', (data) => {
  //   io.emit('chatMessage', data);
  //   console.log(data);
  // });

  socket.on('chatMessage', (data) => {
      io.to(data.room).emit('chatMessage', data); // Emit to specific room
      console.log(data);
  })
  
  // Handle username setting
  socket.on('setUsername', (userName) => {
      userMap.set(socket.id, userName); // Store username
      console.log(`User ${socket.id} set username to ${userName}`);
  });  


  // Handle joining a group (chat room)
  socket.on('joinRoom', (room) => {
    socket.join(room); // User joins the room
    console.log(`${socket.id} joined room ${room}`);
  });


  socket.on('disconnect', () => {
      const userName = userMap.get(socket.id) || 'Anonymous'; // Get username or fallback
      console.log(`${userName} disconnected`);
      io.emit('chatMessage', {
          sender: userName,
          message: `${userName} disconnected`,
          timestamp: new Date().toLocaleTimeString(),
      });
      userMap.delete(socket.id); // Clean up
  });  

});

const port = 3000;
server.listen(port, () => {
  console.log('Chat Server is running on http://localhost:3000');
});

