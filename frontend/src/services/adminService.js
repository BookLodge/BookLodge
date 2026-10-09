import api, { USE_MOCK } from './api';
import { getStoredBookings } from '../mocks/mockBookings';

export const adminService = {
  async getAllBookings({ page = 1, limit = 10, status = '' } = {}) {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      let list = getStoredBookings();
      if (status) {
        list = list.filter((b) => b.status === status);
      }
      return {
        success: true,
        message: 'Admin bookings retrieved',
        data: {
          bookings: list,
          total: list.length,
          page: Number(page),
          limit: Number(limit)
        }
      };
    }
    return await api.get('/admin/bookings', { params: { page, limit, status } });
  },

  async getAllUsers({ page = 1, limit = 10 } = {}) {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      const raw = localStorage.getItem('demo_hotel_users');
      const users = raw ? JSON.parse(raw) : [];
      return {
        success: true,
        message: 'Users retrieved',
        data: {
          users,
          total: users.length,
          page: Number(page),
          limit: Number(limit)
        }
      };
    }
    return await api.get('/admin/users', { params: { page, limit } });
  },

  async deactivateUser(userId) {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      const raw = localStorage.getItem('demo_hotel_users');
      let users = raw ? JSON.parse(raw) : [];
      const user = users.find((u) => u._id === userId);
      if (user) {
        user.isActive = !user.isActive;
        localStorage.setItem('demo_hotel_users', JSON.stringify(users));
        return {
          success: true,
          message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
          data: { user }
        };
      }
      throw new Error('User not found');
    }
    return await api.patch(`/admin/users/${userId}/deactivate`);
  }
};
