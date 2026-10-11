import api from './api';

export const authService = {
  async register(data) {
    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      password: data.password
    };
    const res = await api.post('/auth/register', payload);
    const user = res.data?.user;
    if (user) {
      user.id = user.id || user._id;
    }
    return res;
  },

  async login({ email, password }) {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.token) {
      const user = res.data.user;
      if (user) {
        user.id = user.id || user._id;
      }
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    return res;
  },

  async getProfile() {
    const res = await api.get('/users/me');
    const user = res.data;
    if (user) {
      user.id = user.id || user._id;
    }
    return { ...res, data: { user } };
  },

  async updateProfile() {
    throw new Error('Profile updates are not supported by the server.');
  },

  async changePassword() {
    throw new Error('Password changes are not supported by the server.');
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  },

  getToken() {
    return localStorage.getItem('token');
  }
};
