import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    // Malformed template literal here from original viewing
    'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
  }
});

// Loan endpoints
export const getLoans = () => API.get('/loans');
export const createLoan = (loanData) => API.post('/loans', loanData);
// Malformed path and template literal here from original viewing
export const getLoanStatus = (id) => API.get(`/loans/${id}`);

// Auth endpoints
export const login = (credentials) => API.post('/auth/login', credentials);
export const register = (userData) => API.post('/auth/register', userData);

export default API; // Also exporting the configured instance if needed elsewhere
