import api from './api';

export const hotelService = {
  async getPlaces(query = '') {
    return await api.get('/locations/search', { params: { query } });
  },

  async searchHotels({ placeId, city = '', checkIn = '', checkOut = '', guests = 2, currency = 'USD' } = {}) {
    const now = new Date();
    const d1 = new Date(now); d1.setDate(d1.getDate() + 1);
    const d2 = new Date(now); d2.setDate(d2.getDate() + 4);
    const defaultIn = d1.toISOString().split('T')[0];
    const defaultOut = d2.toISOString().split('T')[0];

    const payload = {
      placeId,
      checkin: checkIn || defaultIn,
      checkout: checkOut || defaultOut,
      occupancies: [{ adults: Number(guests) || 2, children: [] }],
      currency: currency || 'USD',
      guestNationality: 'US'
    };

    return await api.post('/hotels/search', payload);
  },

  async getHotelDetails(hotelId, { checkIn = '', checkOut = '', guests = 2, currency = 'USD' } = {}) {
    const now = new Date();
    const d1 = new Date(now); d1.setDate(d1.getDate() + 1);
    const d2 = new Date(now); d2.setDate(d2.getDate() + 4);
    const defaultIn = d1.toISOString().split('T')[0];
    const defaultOut = d2.toISOString().split('T')[0];

    const payload = {
      checkin: checkIn || defaultIn,
      checkout: checkOut || defaultOut,
      occupancies: [{ adults: Number(guests) || 2, children: [] }],
      currency: currency || 'USD',
      guestNationality: 'US'
    };

    return await api.post('/hotels/' + hotelId + '/details', payload);
  }
};
