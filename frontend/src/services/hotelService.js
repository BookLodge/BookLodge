import api from './api';

export const hotelService = {
  async getPlaces(query = '') {
    return await api.get('/locations/search', { params: { query } });
  },

  async searchHotels({ placeId, city = '', checkIn = '', checkOut = '', guests = 2, currency = 'USD' } = {}) {
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
    const payload = {
      checkin: checkIn,
      checkout: checkOut,
      occupancies: [{ adults: Number(guests) || 2, children: [] }],
      currency: currency || 'USD',
      guestNationality: 'US'
    };

    return await api.post('/hotels/' + hotelId + '/details', payload);
  }
};
