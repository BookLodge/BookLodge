import api from './api';

export const adminService = {
  async getAllBookings({ page = 1, limit = 10, status = '' } = {}) {
    return await api.get('/admin/bookings', { params: { page, limit, status } });
  },

  async getAllUsers({ page = 1, limit = 10 } = {}) {
    return await api.get('/admin/users', { params: { page, limit } });
  },

  async deactivateUser(userId) {
    return await api.patch('/admin/users/' + userId + '/deactivate');
  }
};
