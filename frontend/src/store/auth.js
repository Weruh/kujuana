import { create } from 'zustand';
import axios from 'axios';

const apiBaseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: apiBaseURL,
});

const persistToken = (token) => {
  if (token) {
    localStorage.setItem('kujuana_token', token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem('kujuana_token');
    delete api.defaults.headers.common.Authorization;
  }
};

const storedToken = typeof window !== 'undefined' ? localStorage.getItem('kujuana_token') : null;
if (storedToken) {
  api.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
}

export const useAuthStore = create((set, get) => ({
  token: storedToken,
  user: null,
  loading: false,
  error: null,

  setUser: (user) => set({ user }),

  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', credentials);
      persistToken(data.data.token);
      set({ token: data.data.token, user: data.data.user, loading: false });
      return data.data;
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, loading: false });
      throw error;
    }
  },

  register: async (payload) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', payload);
      persistToken(data.data.token);
      set({ token: data.data.token, user: data.data.user, loading: false });
      return data.data;
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, loading: false });
      throw error;
    }
  },

  logout: () => {
    persistToken(null);
    set({ token: null, user: null });
  },

  fetchProfile: async () => {
    if (!get().token) return null;
    try {
      const { data } = await api.get('/profile/me');
      set({ user: data.data });
      return data.data;
    } catch (error) {
      console.error(error);
      return null;
    }
  },
}));

export { api };

