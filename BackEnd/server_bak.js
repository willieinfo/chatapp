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
  console.log(`${socket.id} : user connected`);
  socket.on('joinRoom', (data) => {
        const { room, userName } = data;
        socket.join(room);
        socket.currentRoom = room;
        socket.userName = userName || 'Anonymous';
        users.set(socket.id, { userName: socket.userName, room });

        console.log(`${socket.userName} (${socket.id}) joined room ${room}`);

        // Notify room of new user
        io.to(room).emit('chatMessage', {
            sender: socket.userName,
            message: `${socket.userName} has joined the chat.`,
            timestamp: new Date().toLocaleTimeString(),
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
            timestamp: new Date().toLocaleTimeString(),
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
                sender: 'SYSTEM',
                message: `${userName} has left the chat.`,
                timestamp: new Date().toLocaleTimeString(),
                source: 'SYSTEM',
                room
            });
        }

        // Remove user from list and broadcast update
        users.delete(socket.id);
        io.emit('userList', Array.from(users.values()));
        console.log(`${userName} disconnected${room ? ` from room ${room}` : ''}`);
    });
  
    // Listen for chatMessage event from the front-end
    // socket.on('chatMessage', (data) => {
    //     const messageData = {
    //         sender: data.sender,
    //         message: data.message,
    //         timestamp: new Date().toLocaleTimeString(),
    //         source: 'SENDING',  // Sender’s message
    //         room: data.room  // Keep track of the room
    //     };

    //     // Emit the message only to the room (excluding sender)
    //     // socket.to(data.room).emit('chatMessage', messageData); // Emit to other clients in the room
    //     // io.to(data.room).emit('chatMessage', messageData); // Emit to specific room
    //     io.emit('chatMessage', messageData); // Emit to specific room
    //     console.log('Message sent to room:', messageData);
    // });    

    // socket.on('chatMessage', (data) => {
    //     const messageData = {
    //         sender: data.sender || socket.userName || 'Anonymous', // Use stored userName if available
    //         message: data.message,
    //         timestamp: new Date().toLocaleTimeString(),
    //         source: 'SENDING',
    //         room: data.room || socket.currentRoom // Use stored room if available
    //     };

    //     // Emit the message to the specific room
    //     io.to(messageData.room).emit('chatMessage', messageData);
    //     console.log('Message sent to room:', messageData);
    // });

    // Listen for room join request
    // socket.on('joinRoom', (room) => {
    //     socket.join(room);  // User joins the specified room
    //     console.log(`${socket.id} joined room ${room}`);
    // });

    // socket.on('joinRoom', (data) => {
    //     const { room, userName } = data; // Expect room and userName in the payload

    //     socket.join(room); // User joins the specified room
    //     socket.currentRoom = room; // Store the current room on the socket
    //     socket.userName = userName || 'Anonymous'; // Store the username, fallback to 'Anonymous'
    //     console.log(`${socket.userName} (${socket.id}) joined room ${room}`);

    //     // Optionally, notify the room that a user has joined
    //     io.to(room).emit('chatMessage', {
    //         sender: 'SYSTEM',
    //         message: `${socket.userName} has joined the chat.`,
    //         timestamp: new Date().toLocaleTimeString(),
    //         source: 'SYSTEM',
    //         room: room
    //     });
    // });

    // When a user disconnects, send a system message to their room
    // socket.on('disconnect', () => {
    //     const userName = socket.userName || 'Anonymous';  // Fallback if no userName
    //     console.log(`${userName} disconnected`);

    //     // Send system message to the room
    //     io.emit('chatMessage', {
    //         sender: 'SYSTEM',
    //         message: `${userName} has left the chat.`,
    //         timestamp: new Date().toLocaleTimeString(),
    //         source: 'SYSTEM',
    //         room: socket.currentRoom  // Send to the last room joined by the user
    //     });
    // });

    // socket.on('disconnect', () => {
    //     const userName = socket.userName || 'Anonymous';
    //     const room = socket.currentRoom;

    //     // Only emit to the room if the user was in one
    //     if (room) {
    //         io.to(room).emit('chatMessage', {
    //             sender: 'SYSTEM',
    //             message: `${userName} has left the chat.`,
    //             timestamp: new Date().toLocaleTimeString(),
    //             source: 'SYSTEM',
    //             room: room
    //         });
    //         console.log(`${userName} disconnected from room ${room}`);
    //     } else {
    //         console.log(`${userName} disconnected (no room assigned)`);
    //     }
    // });


});

const port = 3000;
server.listen(port, () => {
  console.log('Chat Server is running on http://localhost:3000');
});

// io.on('connection', (socket) => {
//   console.log(`${socket.id} : user connected`);

//   socket.on('chatMessage', (data) => {
//       const messageData = {
//           sender: data.sender,
//           message: data.message,
//           timestamp: new Date().toLocaleTimeString(),
//           source: 'SENDING',  // Default to sending
//           room: data.room  // Keep the room info
//       };

//       // io.to(data.room).emit('chatMessage', messageData); // Emit to specific room
//       io.emit('chatMessage', messageData);
//       console.log(data);
//   });

//   socket.on('receiveChatMessage', (data) => {
//       const messageData = {
//           sender: data.sender,
//           message: data.message,
//           timestamp: new Date().toLocaleTimeString(),
//           source: 'RECEIVING',  
//           room: data.room  // Keep the room info
//       };

//       // io.to(data.room).emit('receiveChatMessage', messageData); // Emit to specific room
//       io.emit('receiveChatMessage', messageData);
//       console.log(data);
//   });


//       // Set username for the socket
//   socket.on('setUsername', (userName) => {
//       socket.userName = userName;  // Store username in the socket object
//       console.log(`User ${socket.id} set username to ${userName}`);
//   });

//   // Handle joining a group (chat room)
//   socket.on('joinRoom', (room) => {
//     socket.join(room); // User joins the room
//     console.log(`${socket.id} joined room ${room}`);
//   });

// // Emit a message when the user disconnects
//   socket.on('disconnect', () => {
//       const userName = socket.userName || 'Anonymous';  // Fallback if no userName
//       console.log(`${userName} disconnected`);

//       io.emit('chatMessage', {
//           sender: 'SYSTEM',  // Use 'SYSTEM' for system messages
//           message: `${userName} has left the chat.`,
//           timestamp: new Date().toLocaleTimeString(),
//           source: 'SYSTEM'  // Add source info
//       });
      
//   });  

// });


