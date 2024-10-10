import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './index.css';

const LoginPage = () => {
  const [hostelName, setHostelName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); // State for success message
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^\d{3}$/.test(roomNumber)) {
      setErrorMessage('Invalid room number.');
      return;
    }

    try {
      // Send POST request to the backend
      const response = await axios.post('/login', {
        hostelName,
        roomNumber,
        password
      });

      if (response.status === 200) {
        // Login successful
        setSuccessMessage('Login successful!');
        navigate('/loggedin', { state: { hostelName, roomNumber } });
      } else if (response.status === 201) {
        // User registered successfully
        setSuccessMessage('User registered successfully! Logging in...');
        navigate('/loggedin', { state: { hostelName, roomNumber } });
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setErrorMessage('Incorrect password.');
      } else {
        setErrorMessage('An error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="login-container">
      <h1>Login</h1>
      <br />
      <form onSubmit={handleSubmit}>
        <label>
          Hostel Name:
          <select
            value={hostelName}
            onChange={(e) => setHostelName(e.target.value)}
            required
          >
            <option value="">Select your hostel</option>
            {Array.from({ length: 9 }, (_, i) => `AH${i + 1}`).map((hostel) => (
              <option key={hostel} value={hostel}>{hostel}</option>
            ))}
            {Array.from({ length: 7 }, (_, i) => `CH${i + 1}`).map((hostel) => (
              <option key={hostel} value={hostel}>{hostel}</option>
            ))}
            {Array.from({ length: 6 }, (_, i) => `DH${i + 1}`).map((hostel) => (
              <option key={hostel} value={hostel}>{hostel}</option>
            ))}
          </select>
        </label>
        <br />
        <label>
          Room Number:
          <input
            type="text"
            placeholder='Enter Room Number'
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            required
          />
        </label>
        <br />
        <label>
  Set/Enter Password:
  <input
    type="password"
    placeholder="Enter Password [8 digits]"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required
    minLength={8}
    maxLength={8}
    title="Password must be exactly 8 digits"
  />
</label>

        <br />
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}
        <button type="submit" className='button-login'>Login</button>
      </form>
    </div>
  );
};

export default LoginPage;
