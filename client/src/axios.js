import axios from 'axios';

console.log('API Base URL:', process.env.REACT_APP_API_URL);

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true // Ensure cookies are sent with requests
});

export default instance;