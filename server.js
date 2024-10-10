// const express = require('express');
// const cors = require('cors');
// const { Pool } = require('pg');
// require('dotenv').config();

// const app = express();
// const PORT = process.env.PORT || 5173   ;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // PostgreSQL connection
// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
// });

// // Sample route
// app.get('/', (req, res) => {
//   res.send('Server is running!');
// });

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

// // Fetch all slots for a specific hostel
// app.get('/slots/:hostelName', async (req, res) => {
//     const { hostelName } = req.params;
//     try {
//       const results = await pool.query(`SELECT * FROM ${hostelName}_slots`);
//       res.json(results.rows);
//     } catch (error) {
//       console.error(error.message);
//       res.status(500).send('Server error');
//     }
//   });
  
//   // Add a new slot for a specific hostel
//   app.post('/slots/:hostelName', async (req, res) => {
//     const { hostelName } = req.params;
//     const { date, start_time, end_time, room_number } = req.body;
//     try {
//       await pool.query(
//         `INSERT INTO ${hostelName}_slots (date, start_time, end_time, room_number) VALUES ($1, $2, $3, $4)`,
//         [date, start_time, end_time, room_number]
//       );
//       res.status(201).send('Slot added successfully');
//     } catch (error) {
//       console.error(error.message);
//       res.status(500).send('Server error');
//     }
//   });
  
//   // Delete a specific slot
//   app.delete('/slots/:hostelName/:id', async (req, res) => {
//     const { hostelName, id } = req.params;
//     try {
//       await pool.query(`DELETE FROM ${hostelName}_slots WHERE id = $1`, [id]);
//       res.status(200).send('Slot deleted successfully');
//     } catch (error) {
//       console.error(error.message);
//       res.status(500).send('Server error');
//     }
//   });
  