import api, { USE_MOCK } from './api';

const MOCK_USERS_KEY = 'demo_hotel_users';

const initialUsers = [
  {
    _id: 'user_cust_1',
    firstName: 'Alex',
    lastName: 'Morgan',
    email: 'alex@example.com',
    phone: '+2348012345678',
    role: 'customer',
    isActive: true,
    createdAt: '2026-09-01T10:00:00.000Z'
  },
  {
    _id: 'user_admin_1',
    firstName: 'System',
    lastName: 'Admin',
    email: 'admin@hotelapp.com',
    phone: '+2348098765432',
    role: 'admin',
    isActive: true,
    createdAt: '2026-08-15T12:00:00.000Z'
  }
];

const getStoredUsers = () => {
  const users = localStorage.getItem(MOCK_USERS_KEY);
  if (!users) {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(initialUsers));
    return initialUsers;
  }
  return JSON.parse(users);
};

export const authService = {
  async register(data) {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      const users = getStoredUsers();
      if (users.find((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
        throw new Error('Email already exists');
      }
      const newUser = {
        _id: `user_${Date.now()}`,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || '',
        role: 'customer',
        isActive: true,
        createdAt: new Date().toISOString()
      };
      users.push(newUser);
      localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));

      return {
        success: true,
        message: 'Account created successfully',
        data: { user: newUser }
      };
    }

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
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      const users = getStoredUsers();
      const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        throw new Error('Invalid email or password');
      }
      if (!user.isActive) {
        throw new Error('Account has been deactivated. Please contact support.');
      }

      const token = `mock_jwt_token_${user._id}_${Date.now()}`;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      return {
        success: true,
        message: 'Authentication successful',
        data: {
          token,
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            role: user.role
          }
        }
      };
    }

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
    if (USE_MOCK) {
      return { success: true, data: { user: this.getCurrentUser() } };
    }
    const res = await api.get('/users/me');
    const user = res.data;
    if (user) {
      user.id = user.id || user._id;
    }
    return { ...res, data: { user } };
  },

  async updateProfile(data) {
    if (USE_MOCK) {
      const user = this.getCurrentUser();
      if (user) {
        Object.assign(user, data);
        localStorage.setItem('user', JSON.stringify(user));
      }
      return { success: true, data: { user } };
    }
    throw new Error('Profile updates are not supported by the server.');
  },

  async changePassword(data) {
    if (USE_MOCK) {
      return { success: true, message: 'Password changed successfully' };
    }
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
