import api from './api';

export const bookingService = {
  // Step 1: Prebook - locks rate & returns secretKey/transactionId for LiteAPI
  async prebook({ offerId }) {
    return await api.post('/bookings/prebook', { offerId });
  },

  // Step 2: Book - finalizes booking with BookLodge API after payment confirmation
  async bookHotel({ prebookId, holder, guests }) {
    return await api.post('/bookings', { prebookId, holder, guests });
  },

  // Step 3: Get single booking by ID
  async getBookingById(bookingId) {
    return await api.get('/bookings/' + bookingId);
  },

  // Step 4: Customer booking history
  async getMyBookings({ page = 1, limit = 10 } = {}) {
    return await api.get('/bookings/my-bookings', { params: { page, limit } });
  },

  // Step 5: Cancel confirmed reservation
  async cancelBooking(bookingId) {
    return await api.put('/bookings/' + bookingId);
  }
};
