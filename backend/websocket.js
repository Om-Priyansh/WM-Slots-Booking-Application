// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');
// const cors = require('cors');

// const app = express();
// app.use(cors());

// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: 'http://localhost:5173', // Replace with your frontend URL
//     methods: ['GET', 'POST']
//   }
// });

// io.on('connection', (socket) => {
//   console.log('A user connected');
  
//   // Handle events for fetching and saving slots
//   socket.on('getSlots', (data) => {
//     // Fetch slots from the database and emit them to the client
//   });

//   socket.on('addSlot', (slotData) => {
//     // Save the slot to the database and emit the updated slots
//   });

//   socket.on('disconnect', () => {
//     console.log('A user disconnected');
//   });
// });

// server.listen(5000, () => {
//   console.log('Server is running on port 5000');
// });
