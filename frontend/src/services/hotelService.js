import api, { USE_MOCK } from './api';
import { mockHotels, mockPlaces } from '../mocks/mockHotels';
import { getMockRoomsForHotel } from '../mocks/mockRooms';

export const hotelService = {
  async getPlaces(query = '') {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 200));
      if (!query || query.length < 2) return { success: true, data: { locations: [] } };
      const q = query.toLowerCase();
      const filtered = mockPlaces.filter((p) => p.name.toLowerCase().includes(q));
      return { success: true, message: 'Places retrieved', data: { locations: filtered } };
    }
    return await api.get('/locations/search', { params: { query } });
  },

  async searchHotels({ placeId, city = '', checkIn = '', checkOut = '', guests = 2, currency = 'USD' } = {}) {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 500));
      let results = [...mockHotels];
      if (city) {
        const q = city.toLowerCase();
        results = results.filter(
          (h) =>
            h.city.toLowerCase().includes(q) ||
            h.country.toLowerCase().includes(q) ||
            h.name.toLowerCase().includes(q)
        );
      }
      return {
        success: true,
        message: 'Hotels retrieved',
        data: {
          hotels: results,
          total: results.length
        }
      };
    }

    const payload = {
      placeId,
      checkin: checkIn,
      checkout: checkOut,
      occupancies: [{ adults: Number(guests) || 2, children: [] }],
      currency: currency || 'USD',
      guestNationality: 'US'
    };

    return await api.post('/hotels/search', payload);
  },

  async getHotelDetails(hotelId, { checkIn = '', checkOut = '', guests = 2, currency = 'USD' } = {}) {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      const hotel = mockHotels.find((h) => h.id === hotelId) || mockHotels[0];
      const rooms = getMockRoomsForHotel(hotelId, 1);
      return {
        success: true,
        message: 'Hotel detail retrieved',
        data: {
          ...hotel,
          rates: rooms.map((r) => ({
            offerId: r.offerId,
            roomName: r.name,
            boardName: r.boardType,
            amount: r.pricePerNight,
            currency: 'USD',
            refundable: true
          }))
        }
      };
    }

    const payload = {
      checkin: checkIn,
      checkout: checkOut,
      occupancies: [{ adults: Number(guests) || 2, children: [] }],
      currency: currency || 'USD',
      guestNationality: 'US'
    };

    return await api.post(`/hotels/${hotelId}/details`, payload);
  }
};
