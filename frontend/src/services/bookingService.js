import api, { USE_MOCK } from './api';
import { getStoredBookings, saveBooking, updateBookingStatus } from '../mocks/mockBookings';
import { mockHotels } from '../mocks/mockHotels';

export const bookingService = {
  // Step 1: Prebook ?" locks rate & returns secretKey/transactionId for LiteAPI SDK
  async prebook({ offerId }) {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 600));
      const mockAttempt = {
        prebookId: `pre_${Date.now()}`,
        offerId,
        hotelId: 'mock_hotel_1',
        price: { amount: 450, currency: 'USD' },
        transactionId: `txn_${Date.now()}`,
        secretKey: `pi_mock_${Date.now()}`,
        clientReference: `BL-${Date.now().toString(36).toUpperCase()}`
      };
      return {
        success: true,
        message: 'Hotel prebooked successfully',
        data: mockAttempt
      };
    }

    return await api.post('/bookings/prebook', { offerId });
  },

  // Step 2: Book ?" finalizes booking with BookLodge API after payment confirmation
  async bookHotel({ prebookId, holder, guests }) {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 700));
      const newBooking = {
        _id: `bk_${Date.now()}`,
        clientReference: `BL-${Date.now().toString(36).toUpperCase()}`,
        status: 'CONFIRMED',
        hotel: { hotelId: 'mock_hotel_1', name: 'Mock Grand Hotel' },
        stay: { checkin: '2026-11-10', checkout: '2026-11-13' },
        rooms: [{ occupancyNumber: 1, roomName: 'Deluxe Room', boardName: 'Room Only' }],
        holder,
        price: { amount: 450, currency: 'USD' },
        createdAt: new Date().toISOString()
      };
      saveBooking(newBooking);
      return {
        success: true,
        message: 'Hotel booked successfully',
        data: newBooking
      };
    }

    return await api.post('/bookings', { prebookId, holder, guests });
  },

  // Step 3: Get single booking by ID
  async getBookingById(bookingId) {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      const bookings = getStoredBookings();
      const found = bookings.find((b) => b._id === bookingId || b.clientReference === bookingId);
      if (!found) throw new Error('Booking not found');
      return { success: true, data: found };
    }

    return await api.get(`/bookings/${bookingId}`);
  },

  // Step 4: Customer booking history
  async getMyBookings({ page = 1, limit = 10 } = {}) {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      const bookings = getStoredBookings();
      return {
        success: true,
        message: 'Bookings retrieved successfully',
        data: {
          bookings,
          total: bookings.length,
          page: Number(page),
          limit: Number(limit)
        }
      };
    }

    return await api.get('/bookings/my-bookings', { params: { page, limit } });
  },

  // Step 5: Cancel confirmed reservation
  async cancelBooking(bookingId) {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 500));
      const updated = updateBookingStatus(bookingId, 'CANCELLED');
      return {
        success: true,
        message: 'Booking cancelled successfully',
        data: { bookingId, status: 'CANCELLED' }
      };
    }

    return await api.put(`/bookings/${bookingId}`);
  }
};
