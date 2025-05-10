import axios from 'axios';
import keycloak from './keycloak';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5001/api'
  : 'http://resource-server:5001/api';

const api = axios.create({
  baseURL: API_URL
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
  (config) => {
    if (keycloak.authenticated) {
      config.headers.Authorization = `Bearer ${keycloak.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Car API endpoints
export const carApi = {
  getAllCars: () => api.get('/cars'),
  getCarById: (id) => api.get(`/cars/${id}`),
  createCar: (car) => api.post('/cars', car),
  updateCar: (id, car) => api.put(`/cars/${id}`, car),
  deleteCar: (id) => api.delete(`/cars/${id}`)
};

// Reservation API endpoints
export const reservationApi = {
  getAllReservations: () => api.get('/reservations'),
  getMyReservations: () => api.get('/reservations/my'),
  createReservation: (reservation) => api.post('/reservations', reservation),
  updateReservationStatus: (id, status) => api.put(`/reservations/${id}/status`, { status }),
  deleteReservation: (id) => api.delete(`/reservations/${id}`)
};

export default api; 