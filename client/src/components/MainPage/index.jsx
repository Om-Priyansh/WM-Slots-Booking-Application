import React, { useState, useEffect } from 'react';
import './index.css';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';

import edit_btn from "../../gallery/editbtn.svg";
import delete_btn from "../../gallery/deletebtn.svg";
import logout_btn from "../../gallery/logoutbtn.svg";

const WashingMachineSlots = () => {
  const location = useLocation();
  const navigate = useNavigate(); 
  const { hostelName, roomNumber } = location.state || {};

  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [slots, setSlots] = useState({});
  const [weekOffset, setWeekOffset] = useState(0);
  const timeSlots = [];

  for (let i = 0; i < 24; i++) {
    const hour = i % 12 === 0 ? 12 : i % 12;
    const period = i < 12 ? 'AM' : 'PM';
    const time = `${hour}:00 ${period}`;
    timeSlots.push(time);
  }

  const [weekDates, setWeekDates] = useState([]);

  console.log("The slots:",slots);



  useEffect(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    const currentDayIndex = today.getDay();
    const adjustment = currentDayIndex === 0 ? -6 : 1 - currentDayIndex;
    startOfWeek.setDate(today.getDate() + adjustment);
    const dates = [];
    const offsetStart = new Date(startOfWeek);
    offsetStart.setDate(startOfWeek.getDate() + 7 * weekOffset);
    for (let i = 0; i < 7; i++) {
      const date = new Date(offsetStart);
      date.setDate(offsetStart.getDate() + i);
      dates.push(date);
    }
    setWeekDates(dates);
  }, [weekOffset]);

  useEffect(() => {
    const socket = io('');
    socket.emit('update_slots', hostelName);

    socket.on('slots_updated', (updatedSlots) => {
      console.log("data recieved", updatedSlots);
      console.log("hostel,room:",updatedSlots[0]?.hostel_name,updatedSlots[0]?.room_number,updatedSlots[0]?.date);
      setSlots(updatedSlots);
      console.log("changing slots", slots);
    });

    return () => {
      socket.disconnect();
    };
  }, [hostelName]);

  const today = new Date();

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  const handleAdd = async (e) => {
    e.preventDefault();
  
    const newSlot = { hostelName, roomNumber };
    
    try {
      // Check for existing slots
      const checkResponse = await axios.post('/slots/check', newSlot);
      console.log(checkResponse.data.message); // Display or handle the message if needed
  
      // If no existing slot, proceed to add a new slot
      setModalOpen(true);
    } catch (error) {
      console.error('Error checking for existing slots:', error);
  
      if (error.response && error.response.status === 409) {
        alert(error.response.data.message); // Display a message if a slot already exists
      } else {
        alert('An error occurred while checking for existing slots.'); // Generic error message
      }
    }
  };
  
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedDate && startTime && endTime) {
      const newSlot = { date: selectedDate, startTime, endTime, hostelName, roomNumber };
      // console.log(newSlot?.date);
      await axios.post('/slots', newSlot);
      const socket = io('');
      socket.emit('update_slots', hostelName);
      console.log('update_slots', hostelName);

      if (selectedDate && startTime && endTime) {
        const newSlots = { ...slots };
  
        const dateKey = new Date(selectedDate).toDateString();
        if (!newSlots[dateKey]) {
          newSlots[dateKey] = {};
        }
  
        const startIndex = timeSlots.findIndex((time) => time === startTime);
        const endIndex = timeSlots.findIndex((time) => time === endTime);
  
        for (let i = startIndex; i <= endIndex; i++) {
          newSlots[dateKey][timeSlots[i]] = {
            selected: true,
            hostel: i === startIndex ? hostelName : "", 
            room: i === startIndex ? roomNumber : "",   
          };
        }
        
        // setSlots(newSlots);
        // console.log("changing slots", slots);

      closeModal();
    }
  }
  };

  const formatTime = (time) => {
    // Convert "09:00:00" to "9:00 AM" or "21:00:00" to "9:00 PM"
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour, 10);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const formattedHour = hourNum % 12 || 12; // Adjust for 12-hour clock, making "0" into "12"
    return `${formattedHour}:${minute} ${period}`;
  };

  const isTimeWithinRange = (time, startTime, endTime) => {
    const [timeHour, timeMinute, timePeriod] = parseTime(time);
    const [startHour, startMinute, startPeriod] = parseTime(startTime);
    const [endHour, endMinute, endPeriod] = parseTime(endTime);
  
    const timeValue = convertTo24Hour(timeHour, timeMinute, timePeriod);
    const startValue = convertTo24Hour(startHour, startMinute, startPeriod);
    const endValue = convertTo24Hour(endHour, endMinute, endPeriod);
  
    return timeValue >= startValue && timeValue <= endValue;
  };
  
  // Parse time string like "9:00 AM" to [9, 0, "AM"]
  const parseTime = (timeStr) => {
    const [time, period] = timeStr.split(' ');
    const [hour, minute] = time.split(':').map(Number);
    return [hour, minute, period];
  };
  
  // Convert time like [9, 0, "AM"] into a 24-hour equivalent number (e.g., 900 for 9:00 AM)
  const convertTo24Hour = (hour, minute, period) => {
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return hour * 100 + minute;
  };
  
  

  const handleDeleteSlot = async (hostelName, dateKey, startTime, roomNumber) => {
    console.log("changing slots");
    
    await axios.delete('/slots', { data: {hostelName, date: dateKey, startTime, roomNumber } });
    const socket = io('');
    socket.emit('update_slots', hostelName);

    const newSlots = { ...slots };
  
    // Check if the slot is currently selected
    // if (newSlots[dateKey] && newSlots[dateKey][startTime]?.selected) {
    //   let startIndex = timeSlots.findIndex((t) => t === startTime);
  
    //   // Remove consecutive slots until the end of the selected range
    //   while (
    //     startIndex < timeSlots.length &&
    //     newSlots[dateKey][timeSlots[startIndex]]?.selected
    //   ) {
    //     delete newSlots[dateKey][timeSlots[startIndex]];
    //     startIndex++;
    //   }
    // }
  
    // setSlots(newSlots);
    // console.log("changing slots", slots);

  };

  const goToNextWeek = () => {
    setWeekOffset(weekOffset + 1);
  };

  const goToPrvWeek = () => {
    setWeekOffset(weekOffset - 1);
  };

  const goToThisWeek = () => {
    setWeekOffset(0);
  };

  const handleLogout = () => {
    // Clear any stored tokens or user data (if using localStorage or cookies)
    localStorage.removeItem('token'); // Adjust if you use a different key or method for storing tokens
    navigate('/'); // Redirect the user to the login page
  };

  return (
    <div className="container">
      <header className="header">
        <h1>{hostelName} <span>{roomNumber}  <button
                  type="button"
                  className="delete-btn"
                  onClick={handleLogout}
                >
                  <img src={logout_btn} style={{ width: '25px' }} alt="Logout" />
                </button></span></h1>
        <button className="add-slot-button" onClick={handleAdd}>Add Slot</button>
        
      </header>

      <div className="button-container">
        <button className="next-week-button" onClick={() => setWeekOffset(weekOffset - 1)}>Previous Week</button>
        <button className="next-week-button" onClick={() => setWeekOffset(0)}>Today</button>
        <button className="next-week-button" onClick={() => setWeekOffset(weekOffset + 1)}>Next Week</button>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Add Slot</h2>
            <form onSubmit={handleSubmit}>
              <label>
                Date:
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} required />
              </label>
              <label>
                Start Time:
                <select value={startTime} onChange={(e) => setStartTime(e.target.value)} required>
                  <option value="">Select start time</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </label>
              <label>
                End Time:
                <select value={endTime} onChange={(e) => setEndTime(e.target.value)} required>
              <option value="">Select end time</option>
              {timeSlots.map((time) => {
                // Get the hour from the time string
                const hour = parseInt(time.split(':')[0]);
                const amPm = time.includes('PM') ? 'PM' : 'AM';
                // Calculate the new hour (+1)
                const newHour = hour === 12 ? 1 : hour + 1; // Adjust 12 AM/PM to 1 AM/PM
                return (
                  <option key={time} value={time}>
                    {newHour}:00 {amPm}
                  </option>
                );
              })}
            </select>
              </label>
              <button type="submit">Submit</button>
              <button type="button" onClick={closeModal}>Cancel</button>
            </form>
          </div>
        </div>
      )}

<div className="table-container">
        <div className="table-scroll">
          <table className="time-slot-table">
            <thead>
              <tr>
                <th>Time</th>
                {weekDates.map((date) => (
                  <th
                    key={date}
                    className={date.toDateString() === today.toDateString() ? 'highlight-today' : ''}
                  >
                    {date.toLocaleDateString('en-US', { weekday: 'long' })}
                    <br />
                    {date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
            {timeSlots.map((time) => (
  <tr key={time}>
    <td>{time}</td>
    {weekDates.map((date) => {
      const dateKey = date.toLocaleDateString('en-CA'); // Using 'en-CA' gives a consistent 'YYYY-MM-DD' format in local time

      // Ensure slots is an array and find a matching slot for the date and time
      const slot = Array.isArray(slots)
        ? slots.find(
            (slot) =>
              new Date(slot.formatted_date).toLocaleDateString('en-CA') === dateKey &&
              isTimeWithinRange(time, slot.start_time, slot.end_time)
          )
        : null;

      return (
        <td
          key={`${dateKey}-${time}`}
          className={slot ? 'selected-slot' : ''}
        >
          {slot ? (
            <>
              {slot.room_number} {/* Display room_number if available */}
              {slot.room_number === roomNumber && (
                <button
                  type="button"
                  className="delete-btn"
                  onClick={() =>
                    handleDeleteSlot(slot.hostel_name, slot.formatted_date, slot.start_time, slot.room_number)
                  }
                >
                  <img src={delete_btn} style={{ width: '25px' }} alt="Delete" />
                </button>
              )}
            </>
          ) : null}
        </td>
      );
    })}
  </tr>
))}

</tbody>




          </table>
        </div>
      </div>
    </div>
  );
};

export default WashingMachineSlots;
