import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.20.11:5000/api';

const api = {
  signup: async (userData) => {
    const response = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  login: async (identifier, password) => {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    return response.json();
  },

  verify: async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return null;
    const response = await fetch(`${BASE_URL}/auth/verify`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) return null;
    return response.json();
  },

  recalculate: async (data) => {
    const response = await fetch(`${BASE_URL}/auth/recalculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getMeals: async () => {
    const token = await AsyncStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/meals`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  },

  addMeal: async (meal) => {
    const token = await AsyncStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/meals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(meal),
    });
    return response.json();
  },

  deleteMeal: async (id) => {
    const token = await AsyncStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/meals/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  },
};

export default api;
