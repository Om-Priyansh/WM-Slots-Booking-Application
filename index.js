const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { Pool } = require('pg');
const path = require("path");
const bcrypt = require('bcrypt');
require("dotenv").config();

const PORT = process.env.PORT || 5000;


// created by Om Priyansh Singh

// Initialize Express and server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173' },
});

app.use(cors());
app.use(express.json());



if (process.env.NODE_ENV === "production"){
  app.use(express.static(path.join(__dirname,"client/build")));
}
else{
  app.use(express.static(path.join(__dirname,"client/build")));
}

// PostgreSQL connection pool
const devConfig = {
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
}

const proConfig = {
  connectionString: process.env.POSTGRES_URL, //heroku addons
}

console.log(PORT, process.env.POSTGRES_URL);
const pool = new Pool(
  // process.env.NODE_ENV === "production" ? proConfig : proConfig
  {
    connectionString: process.env.POSTGRES_URL, //heroku addons
  }
);

app.post('/login', async(req,res) => {
  const { hostelName, roomNumber, password } = req.body;

  try {
    // Check if user already exists
    const result = await pool.query(
      'SELECT * FROM users WHERE hostel_name = $1 AND room_number = $2',
      [hostelName, roomNumber]
    );

    if (result.rows.length > 0) {
      // User exists, check password
      const user = result.rows[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        // Correct password, login successful
        return res.status(200).json({ message: 'Login successful' });
      } else {
        // Incorrect password
        return res.status(401).json({ message: 'Incorrect password' });
      }
    } else {
      // User doesn't exist, create new user with hashed password
      const hashedPassword = await bcrypt.hash(password, 10);

      await pool.query(
        'INSERT INTO users (hostel_name, room_number, password) VALUES ($1, $2, $3)',
        [hostelName, roomNumber, hashedPassword]
      );

      return res.status(201).json({ message: 'User registered successfully' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// API to fetch slots
app.get('/slots/:hostel', async (req, res) => {
  const { hostel } = req.params;
  try {
    const query = `SELECT * FROM ${hostel}_slots`;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Check for existing slots
app.post('/slots/check', async (req, res) => {
  const { hostelName, roomNumber } = req.body;

  try {
    // Query to check for existing slots
    const checkQuery = `SELECT * FROM ${hostelName}_slots WHERE room_number = $1`;
    const checkValues = [roomNumber];
    const existingSlots = await pool.query(checkQuery, checkValues);

    // If there are any existing slots, return an error
    if (existingSlots.rows.length > 0) {
      return res.status(409).json({ message: 'Slot already exists' }); // 409 Conflict
    }

    res.status(200).json({ message: 'No existing slots found' }); // No conflict
  } catch (err) {
    console.error(err); // Log the error for debugging
    res.status(500).send('Server error');
  }
});


// API to add new slots
app.post('/slots', async (req, res) => {
  const { date, startTime, endTime, hostelName, roomNumber } = req.body;

  try {

    // Proceed to insert the new slot if no conflict is found
    const query = `
      INSERT INTO ${hostelName}_slots (date, start_time, end_time, hostel_name, room_number) 
      VALUES ($1, $2, $3, $4, $5)
    `;

    const values = [date, startTime, endTime, hostelName, roomNumber];
    await pool.query(query, values);
    res.status(201).send('Slot added');
  } 
  catch (err) {
    console.error(err); // Log the error for debugging
    res.status(500).send('Server error');
  }
});

// API to delete slots
app.delete('/slots', async (req, res) => {
  const { hostelName, date, startTime, roomNumber } = req.body;
  // console.log({ date, startTime, roomNumber });

  // Validate required fields
  if (!hostelName || !date || !startTime || !roomNumber) {
    return res.status(400).send('Missing required fields');
  }

  try {
    const query = `DELETE FROM ${hostelName}_slots WHERE start_time = $1 AND room_number = $2`;
    const values = [startTime, roomNumber];
    console.log(query, values);
    
    const result = await pool.query(query, values);
    
    if (result.rowCount === 0) {
      console.log("ND");
      return res.status(404).send('Slot not found');
    }

    res.status(200).send('Slot deleted');
  } catch (err) {
    console.error(err); // Log the error for debugging
    res.status(500).send('Server error');
  }
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('update_slots', async (hostelName) => {
    const query = `SELECT  id, DATE(date) AS formatted_date, start_time, end_time, hostel_name, room_number FROM ${hostelName}_slots`;
    const result = await pool.query(query);
    // console.log(result);
    io.emit('slots_updated', result.rows);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start the server
// const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
