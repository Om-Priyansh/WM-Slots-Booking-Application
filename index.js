const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Initialize Express and server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'https://wm-slots-booking-app.vercel.app'], // Add your production URL here
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors({
  origin: ['http://localhost:5173', 'https://wm-slots-booking-app.vercel.app'],
  methods: ['GET', 'POST'],
  credentials: true,
}));
app.use(express.json());

// Serve static files
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
} else {
  app.use(express.static(path.join(__dirname, 'client/build')));
}

// PostgreSQL connection pool
const devConfig = {
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
};

const proConfig = {
  connectionString: process.env.POSTGRES_URL, // NeonDB connection string
};

console.log(PORT, process.env.POSTGRES_URL);
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL, // NeonDB connection
});

// Login API
app.post('/login', async (req, res) => {
  const { hostelName, roomNumber, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE hostel_name = $1 AND room_number = $2',
      [hostelName, roomNumber]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        return res.status(200).json({ message: 'Login successful' });
      } else {
        return res.status(401).json({ message: 'Incorrect password' });
      }
    } else {
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

// API to check for existing slots
app.post('/slots/check', async (req, res) => {
  const { hostelName, roomNumber } = req.body;

  try {
    const checkQuery = `SELECT * FROM ${hostelName}_slots WHERE room_number = $1`;
    const existingSlots = await pool.query(checkQuery, [roomNumber]);

    if (existingSlots.rows.length > 0) {
      return res.status(409).json({ message: 'Slot already exists' });
    }

    res.status(200).json({ message: 'No existing slots found' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// API to add new slots
app.post('/slots', async (req, res) => {
  const { date, startTime, endTime, hostelName, roomNumber } = req.body;

  try {
    const query = `
      INSERT INTO ${hostelName}_slots (date, start_time, end_time, hostel_name, room_number) 
      VALUES ($1, $2, $3, $4, $5)
    `;
    const values = [date, startTime, endTime, hostelName, roomNumber];
    await pool.query(query, values);
    res.status(201).send('Slot added');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// API to delete slots
app.delete('/slots', async (req, res) => {
  const { hostelName, date, startTime, roomNumber } = req.body;

  if (!hostelName || !date || !startTime || !roomNumber) {
    return res.status(400).send('Missing required fields');
  }

  try {
    const query = `DELETE FROM ${hostelName}_slots WHERE start_time = $1 AND room_number = $2`;
    const values = [startTime, roomNumber];
    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).send('Slot not found');
    }

    res.status(200).send('Slot deleted');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('update_slots', async (hostelName) => {
    try {
      const query = `SELECT id, DATE(date) AS formatted_date, start_time, end_time, hostel_name, room_number FROM ${hostelName}_slots`;
      const result = await pool.query(query);
      io.emit('slots_updated', result.rows);
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
