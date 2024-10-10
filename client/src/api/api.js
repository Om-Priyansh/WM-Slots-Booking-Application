import axios from 'axios';

const API_URL = 'http://localhost:5000';

export const fetchSlots = async (hostelName) => {
  const response = await axios.get(`${API_URL}/slots/${hostelName}`);
  return response.data;
};

export const addSlot = async (hostelName, slot) => {
  await axios.post(`${API_URL}/slots/${hostelName}`, slot);
};

export const deleteSlot = async (hostelName, id) => {
  await axios.delete(`${API_URL}/slots/${hostelName}/${id}`);
};
