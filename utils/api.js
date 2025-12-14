import axios from 'axios';

// REPLACE with your actual computer's IP address if testing locally
const BASE_URL = 'http://192.168.1.XX:8000'; 

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;